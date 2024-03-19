/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.snomed.snap2snomed.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.InputMismatchException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import javax.validation.Validator;
import javax.xml.bind.DatatypeConverter;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.hibernate.Session;
import org.hibernate.exception.GenericJDBCException;
import org.hibernate.jdbc.Work;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.controller.dto.ImportDetails;
import org.snomed.snap2snomed.controller.dto.ImportMappingFileDetails;
import org.snomed.snap2snomed.controller.dto.MappingImportResponse;
import org.snomed.snap2snomed.model.AdditionalCodeValue;
import org.snomed.snap2snomed.model.ImportedCode;
import org.snomed.snap2snomed.model.ImportedCodeSet;
import org.snomed.snap2snomed.model.MapRow;
import org.snomed.snap2snomed.model.MapRowTarget;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.problem.CodeSetImportProblem;
import org.snomed.snap2snomed.problem.MappingImportProblem;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.repository.ImportedCodeSetRepository;
import org.snomed.snap2snomed.repository.MapRepository;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.snomed.snap2snomed.security.WebSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.multipart.MultipartFile;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

import com.google.common.base.Utf8;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CodeSetImportService {

  public static final String TOO_LARGE_FILE_PROBLEM_URI = Snap2SnomedProblem.BASE_PROBLEM_TYPE_URI + "import/too-many-rows";
  public static final String BAD_MISSING_DELIMITER_PROBLEM_URI = Snap2SnomedProblem.BASE_PROBLEM_TYPE_URI + "import/missing-file-delimiter";

  @Autowired
  private ImportedCodeSetRepository importedCodeSetRepository;

  @Autowired
  private MapRepository mapRepository;

  @Autowired
  private MapRowRepository mapRowRepository;

  @Autowired
  EntityManager entityManager;

  @Autowired
  Validator validator;

  @Autowired
  Snap2snomedConfiguration configuration;

  @Autowired
  private MappingService mappingService;

  @Autowired
  WebSecurity webSecurity;

  private static final List<String> supportedContentTypes = new ArrayList<String>(Arrays.asList("text/plain", "text/csv", "text/tsv"));

  private static class InsertCodeWork implements Work {

    private final List<ImportedCode> codes = new ArrayList<>();
    private int importBatchSize;

    public InsertCodeWork(int importBatchSize) {
      this.importBatchSize = importBatchSize;
    }

    public void add(ImportedCode code) {
      codes.add(code);
    }

    @Override
    public void execute(Connection connection) throws SQLException {
      final PreparedStatement statement = connection.prepareStatement(
          "insert into imported_code (code, display, _index, imported_codeset_id) values (?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
      for (final ImportedCode code : codes) {
        statement.setString(1, code.getCode());
        statement.setString(2, code.getDisplay());
        statement.setLong(3, code.getIndex());
        statement.setLong(4, code.getImportedCodeSet().getId());
        statement.addBatch();
      }
      statement.executeLargeBatch();

      final PreparedStatement additionalColumnsStatement2 = connection.prepareStatement("insert into imported_code_additional_columns (imported_code_id, value, collection_order) values (?, ?, ?)");
      final ResultSet generatedKeys2 = statement.getGeneratedKeys();

      int batchCount = 0;
      for (final ImportedCode code : codes) {
        generatedKeys2.next();
        for (int i=0; i < code.getAdditionalColumns().size(); i++) {
          final String additionalColumnVal = code.getAdditionalColumns().get(i).getValue();
          additionalColumnsStatement2.setLong(1, generatedKeys2.getLong(1));
          additionalColumnsStatement2.setString(2, additionalColumnVal);
          additionalColumnsStatement2.setInt(3, i);
          additionalColumnsStatement2.addBatch();
          batchCount++; 
        }

        if (batchCount >= importBatchSize) {
          additionalColumnsStatement2.executeLargeBatch();
          batchCount = 0;
        }

      }

      additionalColumnsStatement2.executeLargeBatch(); // flush the last few records.

    }
  }

  private  class InsertMappingCodeWork implements Work {

    private final List<MapRowTargetParams> mapRowTargetParams = new ArrayList<>();
    private Long mapId;

    /**
     * @param noMapFlagArg can be null
     * @param mapStatusArg can be null
     */
    public void add(MapRowTarget mapRowTarget, String sourceCode, Long mapId,
      Integer noMapFlagArg, MapStatus mapStatusArg) {

      // default values if non supplied
      Integer noMapFlag = 0;
      Integer mapStatus = MapStatus.DRAFT.ordinal();

      if (noMapFlagArg != null)  {
        noMapFlag = noMapFlagArg;
      }

      if (mapStatusArg != null) {
        mapStatus = mapStatusArg.ordinal();
      }

      mapRowTargetParams.add(new MapRowTargetParams(mapRowTarget, sourceCode, noMapFlag, mapStatus));
      this.mapId = mapId;
    }

    @Override
    public void execute(Connection connection) throws SQLException {
      // Delete existing mapping targets
      // Note: We have to wrap the subquery for IN into another subquery for MySQL. MariaDB doesn't have this issue:
      // see: https://www.xaprb.com/blog/2006/06/23/how-to-select-from-an-update-target-in-mysql
      PreparedStatement statement = connection.prepareStatement(
        "delete from map_row_target where row_id in (select id from (select mr.id from map_row mr " +
        "join map_row_target mt on mr.id = mt.row_id where mr.map_id = ?) mr2)");
      statement.setLong(1, mapId);
      statement.executeUpdate();
      // Set MapRows to UNMAPPED for the map and reset Authors, Reviewers and No Map flag
      statement = connection.prepareStatement(
        "update map_row set status = ?, last_author_id = ?, last_reviewer_id = ?, no_map = 0 where map_id = ?");
      statement.setInt(1, MapStatus.UNMAPPED.ordinal());
      statement.setNull(2, Types.VARCHAR);
      statement.setNull(3, Types.VARCHAR);
      statement.setLong(4, mapId);
      statement.executeUpdate();


      // Now we prepare the values for the insert into commands
      // Get Map Row IDs
      final List<String> sourceCodes = mapRowTargetParams.stream()
          .map(MapRowTargetParams::getSourceCode)
          .collect(Collectors.toList());

      // Allow 1:x mapping to happen - 1 source row for multiple mapping
      final Map<String, Long> rowIds = new HashMap<String, Long>();
      mapRowRepository.findCodesAndMapRowIdsByMapIdAndSourceCodes(mapId, sourceCodes).forEach(rs -> {
        rowIds.put((String) rs[0], (Long) rs[1]);
      });
      final Long rowsToMapCount = mapRowTargetParams.stream()
          .map(MapRowTargetParams::getSourceCode)
          .distinct()
          .count();
      if(rowIds.size() != rowsToMapCount) {
        Set<String> missing = mapRowTargetParams.stream()
          .map(MapRowTargetParams::getSourceCode)
          .filter(element -> !rowIds.containsKey(element))
          .collect(Collectors.toSet());
        throw new MappingImportProblem("invalid-data", "The imported mapping file contains source codes " +
        " that are not in this map " + missing + ".  These codes need to be removed from the mapping file " +
        " before attempting to import it again.");
      }
      mapRowTargetParams.forEach(param -> {
        final MapRow row = new MapRow();
        row.setId(rowIds.get(param.getSourceCode()));
        param.getMapRowTarget().setRow(row);
      });
      // Prepare and execute inserts to import mapping for the map
      statement = connection.prepareStatement(
        "insert into map_row_target (relationship, target_code, target_display, row_id, flagged) " +
        "values(?, ?, ?, ?, ?)");
      for (final MapRowTargetParams mapRowTargetParam : mapRowTargetParams) {
        final MapRowTarget mapRowTarget = mapRowTargetParam.getMapRowTarget();
        if (mapRowTarget.getTargetCode() != null && !mapRowTarget.getTargetCode().isEmpty()) {
          statement.setInt(1, mapRowTarget.getRelationship().ordinal());
          statement.setString(2, mapRowTarget.getTargetCode());
          statement.setString(3, mapRowTarget.getTargetDisplay());
          statement.setLong(4, mapRowTarget.getRow().getId());
          statement.setBoolean(5, mapRowTarget.isFlagged());
          statement.addBatch();
        }
      }
      statement.executeLargeBatch();

      // Obsolete: we now take the status from the file, or use DRAFT if not provided for all rows
      // Set imported MapRows to DRAFT for the map
      // Note: We have to wrap the subquery for IN into another subquery for MySQL. MariaDB doesn't have this issue:
      // see: https://www.xaprb.com/blog/2006/06/23/how-to-select-from-an-update-target-in-mysql
      // statement = connection.prepareStatement(
      //   "update map_row set status = ?, modified = ? where map_id = ? and id in (select id from " +
      //   "(select mr.id from map_row mr join map_row_target mt on mr.id = mt.row_id) mr2)");
      // statement.setInt(1, MapStatus.DRAFT.ordinal());
      // statement.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
      // statement.setLong(3, mapId);
      // statement.executeUpdate();

      // update the status and no_map flag for all rows with a target or a no_map
      statement = connection.prepareStatement(
        "UPDATE map_row SET status = ?, no_map = ?, modified = ? WHERE id = ?");
      for (final MapRowTargetParams mapRowTargetParam : mapRowTargetParams) {
        statement.setInt(1, mapRowTargetParam.getStatus());
        statement.setInt(2, mapRowTargetParam.getNoMapFlag().intValue());
        statement.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
        statement.setLong(4, mapRowTargetParam.getMapRowTarget().getRow().getId());
        statement.addBatch();
      }
      statement.executeLargeBatch();
    }

    int getInsertCount() {
      return this.mapRowTargetParams.size();
    }
  }

  @Transactional
  public ImportedCodeSet importCodeSet(
      @Validated ImportDetails importDetails,
      MultipartFile file) throws HttpMediaTypeNotAcceptableException {

    final ImportedCodeSet importedCodeSet;

    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
      CSVFormat format = detectFileFormat(importDetails.getDelimiter(), file, reader, importDetails.getDisplayColumnIndex());

      if (importDetails.getHasHeader()) {
        format = CSVFormat.Builder.create(format)
            .setHeader()
            .setSkipHeaderRecord(true)
            .setAllowMissingColumnNames(true)
            .setAllowDuplicateHeaderNames(true)
            .build();
      }

      final Set<String> importedCodes = new HashSet<>();
      final MessageDigest md = MessageDigest.getInstance("MD5");

      final InsertCodeWork insertCodeWork = new InsertCodeWork(configuration.getImportBatchSize());
      try (CSVParser parser = format.parse(reader)) {
        importedCodeSet = importedCodeSetRepository.save(importDetails.toImportedCodeSetEntity(parser.getHeaderNames()));

        for (final CSVRecord csvRecord : parser) {
          if (parser.getRecordNumber() > configuration.getMaximumImportedCodeSetRows()) {
            throw Problem.builder()
                .withStatus(Status.BAD_REQUEST)
                .withType(URI.create(TOO_LARGE_FILE_PROBLEM_URI))
                .withTitle("Code set too large to import")
                .withDetail("Code set row count " + parser.getRecordNumber() + " exceeds the maximum supported row count for import "
                    + configuration.getMaximumImportedCodeSetRows()).build();
          }
          validateColumnIndexes(importDetails, csvRecord);
          testLineForBinary(csvRecord.toString());

          String code;
          // If delimiter is null we only read lines and auto-generate ids
          if (importDetails.getDelimiter() == null) {
            code = DatatypeConverter.printHexBinary(md.digest(csvRecord.get(importDetails.getDisplayColumnIndex()).getBytes()))
                .toLowerCase();
            importDetails.setDisplayColumnIndex(0);
          } else {
            code = csvRecord.get(importDetails.getCodeColumnIndex());
          }
          final String display = csvRecord.get(importDetails.getDisplayColumnIndex());
          final long recordNumber = csvRecord.getRecordNumber();

          final List<AdditionalCodeValue> additionalColumnValues = new ArrayList<>();

          if (importDetails.getHasHeader() && null != importDetails.getAdditionalColumnIndexes()) {
            final List<Integer> additionalColumnIndexes = importDetails.getAdditionalColumnIndexes();
            final List<String> additionalColumnTypes = importDetails.getAdditionalColumnTypes();
            if (additionalColumnIndexes.size() < additionalColumnTypes.size()) {
              throw new CodeSetImportProblem("additional-column-mismatch",
                      "Number of specified additional columns and their types do not match",
                      "Additional column indexes specified were " + additionalColumnIndexes +
                              " and additional column types were " + additionalColumnTypes +
                              " - size of these collections must match");
            }
            if (additionalColumnIndexes != null && additionalColumnTypes != null) {
              for (int i = 0; i < additionalColumnIndexes.size(); i++) {
                final Integer index = additionalColumnIndexes.get(i);
                if (index == null) {
                  throw new CodeSetImportProblem("additional-column-index-null",
                          "Null additional column index",
                          "Additional column index " + i +
                                  " is null");
                }
                if(csvRecord.size() < index) {
                  throw new CodeSetImportProblem("additional-column-index-too-large",
                          "Additional column index is beyond CSV size",
                          "Additional column index " + i +
                                  " is " + index + " which is beyond the CSV record size " + csvRecord.size());
                }
                if(parser.getHeaderNames().size() < index) {
                  throw new CodeSetImportProblem("additional-column-index-no-header",

                          "Additional column index is beyond header size",
                          "Additional column index " + i +
                                  " is " + index + " which is beyond the header size " + parser.getHeaderNames().size());
                }
                additionalColumnValues.add(new AdditionalCodeValue(csvRecord.get(index)));
              }
            }
          }

          validateRecord(importedCodes, code, display, recordNumber, additionalColumnValues, importDetails);

          final ImportedCode importedCode = new ImportedCode(null, code, importedCodeSet, recordNumber, display, additionalColumnValues);

          importedCodes.add(code);
          insertCodeWork.add(importedCode);
        }
      }
      entityManager.unwrap(Session.class).doWork(insertCodeWork);
    } catch (final InputMismatchException e) {
      throw new CodeSetImportProblem("invalid-delimiter", "Invalid delimiter specfied, the first line does not contain the delimiter", e.getLocalizedMessage());
    } catch (final IndexOutOfBoundsException e) {
      throw new CodeSetImportProblem("invalid-column", "Invalid column specfied", e.getLocalizedMessage());
    } catch (final NoSuchAlgorithmException e ) {
      log.error("Unecpected error creating MD5 hash for code", e);
      throw Problem.valueOf(Status.INTERNAL_SERVER_ERROR, "Unexpected error creating MD5 hash for code");
    } catch (final IOException e) {
      log.error("Failed reading code set from an import request", e);
      throw Problem.valueOf(Status.INTERNAL_SERVER_ERROR, "Unable to read the file in the request due to an I/O error");
    } catch (IllegalStateException|IllegalArgumentException e) {
      throw new CodeSetImportProblem("invalid-file", "Invalid data encountered in source file", e.getLocalizedMessage());
    } catch (final GenericJDBCException e) {
      throw Problem.valueOf(Status.INTERNAL_SERVER_ERROR, "JDBC Exception:" + e.getLocalizedMessage());
    }
    entityManager.flush();
    entityManager.clear();

    return importedCodeSet;
  }

  private void validateColumnIndexes(ImportDetails importDetails, CSVRecord csvRecord) {
    if (csvRecord.size() - 1 < importDetails.getCodeColumnIndex()) {
      throw new CodeSetImportProblem("invalid-code-index", "Code column index is invalid", "Code column index "
          + importDetails.getCodeColumnIndex() + " is more than the number of columns in the record " + csvRecord.size());
    }
    if (csvRecord.size() - 1 < importDetails.getDisplayColumnIndex()) {
      throw new CodeSetImportProblem("invalid-display-index", "Display column index is invalid", "Display column index "
          + importDetails.getCodeColumnIndex() + " is more than the number of columns in the record " + csvRecord.size());
    }
  }

  private void validateColumnIndexes(ImportMappingFileDetails importDetails, CSVRecord csvRecord) {
    if (csvRecord.size() - 1 < importDetails.getCodeColumnIndex()) {
      throw new CodeSetImportProblem("invalid-code-index", "Code column index is invalid", "Code column index "
          + importDetails.getCodeColumnIndex() + " is more than the number of columns in the record " + csvRecord.size());
    }
    if (csvRecord.size() - 1 < importDetails.getTargetCodeColumnIndex()) {
      throw new CodeSetImportProblem("invalid-target-code-index", "Target Code column index is invalid", "Target Code column index "
          + importDetails.getTargetCodeColumnIndex() + " is more than the number of columns in the record " + csvRecord.size());
    }
    if (csvRecord.size() - 1 < importDetails.getTargetDisplayColumnIndex()) {
      throw new CodeSetImportProblem("invalid-target-display-index", "Target Display column index is invalid", "Target Display column index "
          + importDetails.getTargetDisplayColumnIndex() + " is more than the number of columns in the record " + csvRecord.size());
    }
    if (csvRecord.size() - 1 < importDetails.getRelationshipColumnIndex()) {
      throw new CodeSetImportProblem("invalid-relationship-index", "Relationship column index is invalid", "Relationship column index "
          + importDetails.getRelationshipColumnIndex() + " is more than the number of columns in the record " + csvRecord.size());
    }
    //optional fields
    if (importDetails.getNoMapFlagColumnIndex() != null && csvRecord.size() - 1 < importDetails.getNoMapFlagColumnIndex()) {
      throw new CodeSetImportProblem("invalid-relationship-index", "Relationship column index is invalid", "Relationship column index "
          + importDetails.getNoMapFlagColumnIndex() + " is more than the number of columns in the record " + csvRecord.size());
    }
    if (importDetails.getStatusColumnIndex() != null && csvRecord.size() - 1 < importDetails.getStatusColumnIndex()) {
      throw new CodeSetImportProblem("invalid-relationship-index", "Relationship column index is invalid", "Relationship column index "
          + importDetails.getStatusColumnIndex() + " is more than the number of columns in the record " + csvRecord.size());
    }
  }
  private void validateRecord(Set<String> importedCodes, String code, String targetCode,
                              String targetDisplay, long recordNumber, Integer noMapFlag, MapStatus status) {
    checkCode(code, recordNumber);
    checkCode(targetCode, recordNumber);
    checkDuplicateCodes(importedCodes, code + targetCode);
    checkDisplay(targetDisplay, recordNumber);
    checkNoMapFlag(targetCode, noMapFlag);
    checkStatus(targetCode, status);
  }

  private void validateRecord(Set<String> importedCodes, String code, String display, long recordNumber, List<AdditionalCodeValue> additionalColumnValues,
      ImportDetails importDetails) {
    checkCode(code, recordNumber);
    checkDuplicateCodes(importedCodes, code);
    checkDisplay(display, recordNumber);
    checkAdditionalColumn(additionalColumnValues, importDetails.getAdditionalColumnIndexes(), recordNumber);
  }

  private void checkCode(String code, long recordNumber) {
    if (code == null || code.isBlank()) {
      throw new CodeSetImportProblem("code-blank", "Code in the import file is blank",
          "The code value for record " + recordNumber + " is blank in the import file");
    } else if (code.length() > ImportedCode.CODE_SIZE_LIMIT) {
      throw new CodeSetImportProblem("code-size", "Code in the import file is too large",
          "The code value for record " + recordNumber + " is too long: " + code.length() + " is greater than the limit of "
              + ImportedCode.CODE_SIZE_LIMIT + " " + code);
    }
  }

  private void checkDuplicateCodes(Set<String> importedCodes, String code) {
    if (importedCodes.contains(code)) {
      throw new CodeSetImportProblem("duplicate-code", "Code value is duplicated in the import file",
          "The code value '" + code + "' is duplicated in the import file");
    }
  }

  private void checkDisplay(String display, long recordNumber) {
    if ((display == null || display.isBlank())) {
      throw new CodeSetImportProblem("display-blank", "Display in the import file is blank",
          "The display value for record " + recordNumber + " is blank in the import file");
    } else if (display.length() > ImportedCode.DISPLAY_SIZE_LIMIT) {
      throw new CodeSetImportProblem("display-size", "Display in the import file is too large",
          "The display value of record " + recordNumber + " is too long: " + display.length() + " is greater than the limit of " + ImportedCode.DISPLAY_SIZE_LIMIT);
    }
  }

  private void checkNoMapFlag(String targetCode, Integer noMapFlag) {

    // cannot have a row with a target and the noMap flag ticked
    if ((noMapFlag != null) && (noMapFlag == Integer.valueOf(1)) && (targetCode != null && !(targetCode.isBlank()))) {
      throw new CodeSetImportProblem("no-map-with-target", "The import file contains no map rows with a target",
          "A row with target code " + targetCode + " has no map specified. Rows cannot have both a target and be a no map.");
    }

  }

  private void checkStatus(String targetCode, MapStatus status) {

    // cannot have a row with a target and be in the "unmapped" state
    if ((status != null) && (status.equals(MapStatus.UNMAPPED) == true) && (targetCode != null && !(targetCode.isBlank()))) {
      throw new CodeSetImportProblem("map-with-unmapped-status", "The import file contains rows with a target and an unmapped status",
          "A row with target code " + targetCode + " has a status of UNMAPPED specified. Rows with a target must have a status of MAPPED or DRAFT.");
    }
  }

  private void checkAdditionalColumn(List<AdditionalCodeValue> additionalColumnValues, List<Integer> additionalColumnIndexes, long recordNumber) {
    Integer additionalColumnCount = 1;
    for (AdditionalCodeValue additionalColumnValue : additionalColumnValues) 
    { 
      if (additionalColumnValue.getValue().length() > ImportedCode.ADDITIONAL_COLUMN_SIZE_LIMIT) {
        throw new CodeSetImportProblem("additional-column-size", "Additional Column in the import file is too large",
            "Column " + (additionalColumnIndexes.get(additionalColumnCount-1)+1) + " of record " + recordNumber + " is too long: " + additionalColumnValue.getValue().length() + " is greater than the limit of "
                + ImportedCode.ADDITIONAL_COLUMN_SIZE_LIMIT);
      }
      additionalColumnCount++;
    }
  }

  protected CSVFormat detectFileFormat(Character delimiter, MultipartFile file, BufferedReader reader, Integer columnIndex)
            throws IOException, HttpMediaTypeNotAcceptableException {
    final CSVFormat format = CSVFormat.DEFAULT;
    final String contentType = file.getContentType();
    final String line = getLineFromReader(reader);
    testLineForBinary(line);
    if (delimiter != null && line.indexOf(delimiter) == -1) {
      throw new InputMismatchException("Invalid delimiter! The first line does not contain the delimiter character: '" + delimiter + "'");
    }

    if (!supportedContentTypes.contains(contentType)) {
      throw new HttpMediaTypeNotAcceptableException("Unsupported content type: " + contentType);
    }

    if (delimiter != null) {
      return format.withDelimiter(delimiter);
    }

    return format.withDelimiter('\0');
  }

  private String getLineFromReader(BufferedReader reader) throws IOException {
    reader.mark(1024);
    final String line = reader.readLine();
    reader.reset();
    if (line == null) {
      throw new CodeSetImportProblem("empty-file", "File to import has no content");
    }
    return line;
  }

  private void testLineForBinary(String line) {
    if (line.chars().filter(chr -> chr < 32).filter(chr -> chr != 9).count() > 0
        || !Utf8.isWellFormed(line.getBytes())) {
      throw new CodeSetImportProblem("invalid-characters", "The file contains invalid characters.");
    }
  }

  @Transactional
  public MappingImportResponse importMappings(
    @Validated ImportMappingFileDetails importDetails,
    MultipartFile file) throws HttpMediaTypeNotAcceptableException {

    final Long start = System.currentTimeMillis();
    log.info("Mapping file import started...");
    final Optional<org.snomed.snap2snomed.model.Map> map = mapRepository.findById(Long.valueOf(importDetails.getMapId()));
    if (!map.isPresent()) {
      throw new MappingImportProblem("invalid-map-id", "Invalid map id provided");
    }

    if (!(webSecurity.isAdminUser() || webSecurity.isProjectOwnerForMapId(map.get().getId()))) {
      throw new NotAuthorisedProblem("Not authorised to import mapping if the user is not admin or member of an associated project!");
    }

    // If delimiter is null throw an error message
    if (importDetails.getDelimiter() == null) {
      Problem.builder()
        .withStatus(Status.BAD_REQUEST)
        .withType(URI.create(BAD_MISSING_DELIMITER_PROBLEM_URI))
        .withTitle("Missing file delimiter");
    }

    // We expect header for now
    if (!importDetails.getHasHeader()) {
      throw new MappingImportProblem("no-header", "Import file does not have a header! Please include the correct headers.");
    }

    final MappingImportResponse importResponse = new MappingImportResponse();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
      CSVFormat format = detectFileFormat(importDetails.getDelimiter(), file, reader, importDetails.getTargetCodeColumnIndex());

      // We expect header for the mapping file but we might change this expectation later
      if (importDetails.getHasHeader()) {
        format = format.withFirstRecordAsHeader().withAllowMissingColumnNames().withAllowDuplicateHeaderNames();
      }

      final Set<String> importedCodes = new HashSet<>();

      try (CSVParser parser = format.parse(reader)) {
        final InsertMappingCodeWork insertMappingCodeWork = new InsertMappingCodeWork();
        for (final CSVRecord csvRecord : parser) {
          if (parser.getRecordNumber() > configuration.getMaximumImportedCodeSetRows()) {
            throw Problem.builder()
                    .withStatus(Status.BAD_REQUEST)
                    .withType(URI.create(TOO_LARGE_FILE_PROBLEM_URI))
                    .withTitle("Mapping file too large to import")
                    .withDetail("Mapping file row count " + parser.getRecordNumber() + " exceeds the maximum supported row count for import "
                            + configuration.getMaximumImportedCodeSetRows()).build();
          }
          validateColumnIndexes(importDetails, csvRecord);
          testLineForBinary(csvRecord.toString());
          final String code = csvRecord.get(importDetails.getCodeColumnIndex());
          final String targetCode = csvRecord.get(importDetails.getTargetCodeColumnIndex());
          final String targetDisplay = csvRecord.get(importDetails.getTargetDisplayColumnIndex());
          final String relationship = csvRecord.get(importDetails.getRelationshipColumnIndex());
          // optional
          Integer noMap = null;
          if (importDetails.getNoMapFlagColumnIndex() != null) {
            final String noMapString = csvRecord.get(importDetails.getNoMapFlagColumnIndex());
            noMap = Boolean.parseBoolean(noMapString) ? 1 : 0;
          }
          MapStatus status = null;
          if (importDetails.getStatusColumnIndex() != null) {
            final String stringStatus = csvRecord.get(importDetails.getStatusColumnIndex());
            status = MapStatus.valueOf(stringStatus);
          }
          final long recordNumber = csvRecord.getRecordNumber();
          if (targetCode != null && !targetCode.isEmpty()) {
            validateRecord(importedCodes, code, targetCode, targetDisplay, recordNumber, noMap, status);
            final MapRowTarget mapRowTarget = MapRowTarget.builder()
                    .targetCode(targetCode)
                    .targetDisplay(targetDisplay)
                    .relationship(MappingRelationship.valueOf(relationship))
                    .build();
            insertMappingCodeWork.add(mapRowTarget, code, Long.valueOf(importDetails.getMapId()),
              noMap, status);
            importedCodes.add(code + targetCode);
          }
          else if (noMap != null && noMap.equals(1)) {
            // no target code but no map has been ticked
            insertMappingCodeWork.add(new MapRowTarget(), code, Long.valueOf(importDetails.getMapId()),
              noMap, status);
          }
        }
        importResponse.setRecordCount(parser.getRecordNumber());

        if (insertMappingCodeWork.getInsertCount() > 0) {
          entityManager.unwrap(Session.class).doWork(insertMappingCodeWork);
        }
        importResponse.setInsertCount(insertMappingCodeWork.getInsertCount());
      }
      importResponse.setTargetValidation(mappingService.validateMapTargets(Long.valueOf(importDetails.getMapId())));
    } catch (final InputMismatchException e) {
      throw new MappingImportProblem("invalid-delimiter", "Invalid delimiter specfied, the first line does not contain the delimiter", e.getLocalizedMessage());
    } catch (final IndexOutOfBoundsException e) {
      throw new MappingImportProblem("invalid-column", "Invalid column specfied", e.getLocalizedMessage());
    } catch (final IOException e) {
      log.error("Failed reading mapping details from import request", e);
      throw Problem.valueOf(Status.INTERNAL_SERVER_ERROR, "Unable to read the file in the request due to an I/O error");
    } catch (IllegalStateException|IllegalArgumentException e) {
      throw new MappingImportProblem("invalid-file", "Invalid data encountered in the mapping file", e.getLocalizedMessage());
    }
    entityManager.flush();
    entityManager.clear();
    final Long end = System.currentTimeMillis();
    log.info("Executed mapping import for " + importResponse.getRecordCount() + " lines in " +  Long.valueOf(end - start) + " ms");
    return importResponse;
  }
}
