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

import com.google.common.base.Utf8;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.hibernate.Session;
import org.hibernate.jdbc.Work;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.controller.dto.ImportDetails;
import org.snomed.snap2snomed.controller.dto.ImportMappingFileDetails;
import org.snomed.snap2snomed.controller.dto.MappingImportResponse;
import org.snomed.snap2snomed.model.*;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.problem.CodeSetImportProblem;
import org.snomed.snap2snomed.problem.MappingImportProblem;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.repository.ImportedCodeSetRepository;
import org.snomed.snap2snomed.repository.MapRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.security.WebSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.multipart.MultipartFile;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import javax.validation.Validator;
import javax.xml.bind.DatatypeConverter;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.*;
import java.util.Map;
import java.util.*;

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
  private AuthenticationFacade authenticationFacade;

  @Autowired
  private FhirService fhirService;

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

    private List<ImportedCode> codes = new ArrayList<>();

    public void add(ImportedCode code) {
      codes.add(code);
    }

    @Override
    public void execute(Connection connection) throws SQLException {
      PreparedStatement statement = connection.prepareStatement(
          "insert into imported_code (code, display, _index, imported_codeset_id) values (?, ?, ?, ?)");
      for (ImportedCode code : codes) {
        statement.setString(1, code.getCode());
        statement.setString(2, code.getDisplay());
        statement.setLong(3, code.getIndex());
        statement.setLong(4, code.getImportedCodeSet().getId());
        statement.addBatch();
      }
      statement.executeLargeBatch();
    }
  }

  private static class InsertMappingCodeWork implements Work {

    private List<MapRowTargetParams> mapRowTargetParams = new ArrayList<>();
    private Long mapId;

    public void add(MapRowTarget mapRowTarget, String sourceCode, Long mapId) {
      mapRowTargetParams.add(new MapRowTargetParams(mapRowTarget, sourceCode));
      this.mapId = mapId;
    }

    @Override
    public void execute(Connection connection) throws SQLException {
      // Delete existing mapping
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

      // This import implementation reduces import time from 2.8 minutes to 23 seconds
      // Instead of using
      //     "insert into map_row_target (relationship, target_code, target_display, row_id, flagged) " +
      //     "select ?, ?, ?, mr.id, false from map_row as mr " +
      //     "join imported_code ic on ic.id = mr.source_code_id AND ic.code = ? " +
      //     "where map_id = ?"
      // Now we prepare the values for the insert into commands
      // Get Map Row IDs
      List<String> sourceCodes = new ArrayList<String>();
      mapRowTargetParams.forEach(mapRowTargetParam -> sourceCodes.add(mapRowTargetParam.getSourceCode()));
      String sourceCodeParam = "'" + String.join("','", sourceCodes) + "'";
      // PreparedStatement doesn't allow multiple values for parameters to avoid SQL injection attacks
      // so sourceCodeParam is an actual string here
      statement = connection.prepareStatement("select ic.code, mr.id from map_row as mr " +
        "join imported_code ic on ic.id = mr.source_code_id AND ic.code in ("  + sourceCodeParam + ") " +
        "where map_id = ?");
      statement.setLong(1, mapId);
      ResultSet rs = statement.executeQuery();
      // Allow 1:x mapping to happen - 1 source row for multiple mapping
      Map<String, Long> rowIds = new HashMap<String, Long>();
      while (rs.next()) {
        rowIds.put(rs.getString("code"), rs.getLong("id"));
      }
      Long rowsToMapCount = mapRowTargetParams.stream().map(params -> params.getSourceCode()).distinct().count();
      if(rowIds.size() != rowsToMapCount) {
        throw new MappingImportProblem("invalid-data", "The import result record count does not match " +
        "the number of source codes supplied to it [" + rowIds.size() + " vs " +rowsToMapCount + "] " +
        "Check that the source code column has correct codes.");
      }
      mapRowTargetParams.forEach(param -> {
        param.getMapRowTarget().setRow(new MapRow());
        param.getMapRowTarget().getRow().setId(rowIds.get(param.getSourceCode()));
      });
      // Prepare and execute inserts to import mapping for the map
      statement = connection.prepareStatement(
        "insert into map_row_target (relationship, target_code, target_display, row_id, flagged) " +
        "values(?, ?, ?, ?, ?)");
      for (MapRowTargetParams mapRowTargetParam : mapRowTargetParams) {
        statement.setInt(1, mapRowTargetParam.getMapRowTarget().getRelationship().ordinal());
        statement.setString(2, mapRowTargetParam.getMapRowTarget().getTargetCode());
        statement.setString(3, mapRowTargetParam.getMapRowTarget().getTargetDisplay());
        statement.setLong(4, mapRowTargetParam.getMapRowTarget().getRow().getId());
        statement.setBoolean(5, mapRowTargetParam.getMapRowTarget().isFlagged());
        statement.addBatch();
      }
      statement.executeLargeBatch();

      // Set imported MapRows to DRAFT for the map
      // Note: We have to wrap the subquery for IN into another subquery for MySQL. MariaDB doesn't have this issue:
      // see: https://www.xaprb.com/blog/2006/06/23/how-to-select-from-an-update-target-in-mysql
      statement = connection.prepareStatement(
        "update map_row set status = ?, modified = ? where map_id = ? and id in (select id from " +
        "(select mr.id from map_row mr join map_row_target mt on mr.id = mt.row_id) mr2)");
      statement.setInt(1, MapStatus.DRAFT.ordinal());
      statement.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
      statement.setLong(3, mapId);
      statement.executeUpdate();
    }

    int getInsertCount() {
      return this.mapRowTargetParams.size();
    }
  }  

  @Transactional
  public ImportedCodeSet importCodeSet(
      @Validated ImportDetails importDetails,
      MultipartFile file) throws HttpMediaTypeNotAcceptableException {

    ImportedCodeSet importedCodeSet = importedCodeSetRepository.save(importDetails.toImportedCodeSetEntity());

    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
      CSVFormat format = detectFileFormat(importDetails.getDelimiter(), file, reader, importDetails.getDisplayColumnIndex());

      if (importDetails.getHasHeader()) {
        format = format.withFirstRecordAsHeader().withAllowMissingColumnNames().withAllowDuplicateHeaderNames();
      }

      Set<String> importedCodes = new HashSet<>();
      MessageDigest md = MessageDigest.getInstance("MD5");

      InsertCodeWork insertCodeWork = new InsertCodeWork();
      try (CSVParser parser = format.parse(reader)) {
        for (CSVRecord csvRecord : parser) {
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
          String display = csvRecord.get(importDetails.getDisplayColumnIndex());
          long recordNumber = csvRecord.getRecordNumber();

          validateRecord(importedCodes, code, display, recordNumber);

          ImportedCode importedCode = new ImportedCode(null, code, importedCodeSet, recordNumber, display);

          importedCodes.add(code);
          insertCodeWork.add(importedCode);
        }
      }
      entityManager.unwrap(Session.class).doWork(insertCodeWork);
    } catch (InputMismatchException e) {
      throw new CodeSetImportProblem("invalid-delimiter", "Invalid delimiter specfied, the first line does not contain the delimiter", e.getLocalizedMessage());
    } catch (IndexOutOfBoundsException e) {
      throw new CodeSetImportProblem("invalid-column", "Invalid column specfied", e.getLocalizedMessage());
    } catch (NoSuchAlgorithmException e ) {
      log.error("Unecpected error creating MD5 hash for code", e);
      throw Problem.valueOf(Status.INTERNAL_SERVER_ERROR, "Unecpected error creating MD5 hash for code");
    } catch (IOException e) {
      log.error("Failed reading code set from an import request", e);
      throw Problem.valueOf(Status.INTERNAL_SERVER_ERROR, "Unable to read the file in the request due to an I/O error");
    } catch (IllegalStateException|IllegalArgumentException e) {
      throw new CodeSetImportProblem("invalid-file", "Invalid data encountered in source file", e.getLocalizedMessage());
    }

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
  }
  private void validateRecord(Set<String> importedCodes, String code, String targetCode,
                              String targetDisplay, long recordNumber) {
    checkCode(code, recordNumber);
    checkCode(targetCode, recordNumber);
    checkDuplicateCodes(importedCodes, code + targetCode);
    checkDisplay(targetDisplay, recordNumber);
  }

  private void validateRecord(Set<String> importedCodes, String code, String display, long recordNumber) {
    checkCode(code, recordNumber);
    checkDuplicateCodes(importedCodes, code);
    checkDisplay(display, recordNumber);
  }

  private void checkCode(String code, long recordNumber) {
    if (code == null || code.isBlank()) {
      throw new CodeSetImportProblem("code-blank", "Code in the import file is blank",
          "The code value for record " + recordNumber + " is blank in the import file");
    } else if (code.length() > ImportedCode.CODE_SIZE_LIMIT) {
      throw new CodeSetImportProblem("code-size", "Code in the import file is too large",
          "The code value for record " + recordNumber + " is " + code.length() + " which longer than the allowed limit of "
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
          "The display value for record " + recordNumber + " is " + display.length() + " which is longer than the allowed limit of "
              + ImportedCode.DISPLAY_SIZE_LIMIT);
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

    Long start = System.currentTimeMillis();
    log.info("Mapping file import started...");
    Optional<org.snomed.snap2snomed.model.Map> map = mapRepository.findById(Long.valueOf(importDetails.getMapId()));
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

    MappingImportResponse importResponse = new MappingImportResponse();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
      CSVFormat format = detectFileFormat(importDetails.getDelimiter(), file, reader, importDetails.getTargetCodeColumnIndex());

      // We expect header for the mapping file but we might change this expectation later
      if (importDetails.getHasHeader()) {
        format = format.withFirstRecordAsHeader().withAllowMissingColumnNames().withAllowDuplicateHeaderNames();
      }

      Set<String> importedCodes = new HashSet<>();

      try (CSVParser parser = format.parse(reader)) {
        InsertMappingCodeWork insertMappingCodeWork = new InsertMappingCodeWork();
        for (CSVRecord csvRecord : parser) {
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
          String code = csvRecord.get(importDetails.getCodeColumnIndex());
          String targetCode = csvRecord.get(importDetails.getTargetCodeColumnIndex());
          String targetDisplay = csvRecord.get(importDetails.getTargetDisplayColumnIndex());
          String relationship = csvRecord.get(importDetails.getRelationshipColumnIndex());
          long recordNumber = csvRecord.getRecordNumber();

          if (targetCode != null && !targetCode.isEmpty()) {
            validateRecord(importedCodes, code, targetCode, targetDisplay, recordNumber);
            MapRowTarget mapRowTarget = MapRowTarget.builder()
                    .targetCode(targetCode)
                    .targetDisplay(targetDisplay)
                    .relationship(MappingRelationship.valueOf(relationship))
                    .build();
            insertMappingCodeWork.add(mapRowTarget, code, Long.valueOf(importDetails.getMapId()));
            importedCodes.add(code + targetCode);
          }
        }
        importResponse.setRecordCount(parser.getRecordNumber());

        if (insertMappingCodeWork.getInsertCount() > 0) {
          entityManager.unwrap(Session.class).doWork(insertMappingCodeWork);
        }
        importResponse.setInsertCount(insertMappingCodeWork.getInsertCount());
      }
      importResponse.setTargetValidation(mappingService.validateMapTargets(Long.valueOf(importDetails.getMapId())));
    } catch (InputMismatchException e) {
      throw new MappingImportProblem("invalid-delimiter", "Invalid delimiter specfied, the first line does not contain the delimiter", e.getLocalizedMessage());
    } catch (IndexOutOfBoundsException e) {
      throw new MappingImportProblem("invalid-column", "Invalid column specfied", e.getLocalizedMessage());
    } catch (IOException e) {
      log.error("Failed reading mapping details from import request", e);
      throw Problem.valueOf(Status.INTERNAL_SERVER_ERROR, "Unable to read the file in the request due to an I/O error");
    } catch (IllegalStateException|IllegalArgumentException e) {
      throw new MappingImportProblem("invalid-file", "Invalid data encountered in the mapping file", e.getLocalizedMessage());
    }
    entityManager.flush();
    entityManager.clear();
    Long end = System.currentTimeMillis();
    log.info("Executed mapping import for " + importResponse.getRecordCount() + " lines in " +  Long.valueOf(end - start) + " ms");
    return importResponse;
  }
}
