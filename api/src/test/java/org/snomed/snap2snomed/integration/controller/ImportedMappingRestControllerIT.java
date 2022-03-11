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

package org.snomed.snap2snomed.integration.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.snomed.snap2snomed.service.CodeSetImportService.TOO_LARGE_FILE_PROBLEM_URI;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.Set;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.controller.dto.MappingImportResponse;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.snomed.snap2snomed.model.MapRowTarget;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.springframework.core.io.ClassPathResource;

@TestInstance(Lifecycle.PER_CLASS)
public class ImportedMappingRestControllerIT extends IntegrationTestBase {

  private static final String UNAUTHORISED_TEST_USER_SUBJECT = "unauthorised-user";

  private static final String INVALID_MAP_ID_URI = "http://snap2snomed.app/problem/mapping-import/invalid-map-id";
  private static final String UNAUTHORISED_USER_PROBLEM_URI = "http://snap2snomed.app/problem/not-authorised";
  private static final String DISPLAY_BLANK_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/display-blank";
  private static final String CODE_BLANK_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/code-blank";
  private static final String DUPLICATE_CODE_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/duplicate-code";
  private static final String CODE_SIZE_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/code-size";
  private static final String DISPLAY_SIZE_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/display-size";
  private static final String DELIMITER_PROBLEM_URI = "http://snap2snomed.app/problem/mapping-import/invalid-delimiter";
  private static final String TAGET_DISPLAY_INDEX_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/invalid-target-display-index";
  private static final String CODE_INDEX_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/invalid-code-index";
  private static final String TARGET_CODE_INDEX_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/invalid-target-code-index";
  private static final String RELATIONSHIP_INDEX_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/invalid-relationship-index";
  private static final String INVALID_DATA_PROBLEM_URI = "http://snap2snomed.app/problem/mapping-import/invalid-data";  
  private static final String NO_HEADER_PROBLEM_URI = "http://snap2snomed.app/problem/mapping-import/no-header";  

  private static final String[] AAA_TSV_COLUMN_2_LIST = {"3218000", "275716001", "272393004", "236915005", "159136000", "44644008",
      "281155009", "17312001", "264613005", "82809009", "20158009", "20158009", "264613005", "20158009"};

  private Long projectId;
  private Long mapId;
  private Long mapId2;
  private Long codesetId;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(UNAUTHORISED_TEST_USER_SUBJECT, "Unauthorised", "Bob", "User", "unauthorised@user.com");
    projectId = restClient.createProject("ProjectDemo", "Demo Project", Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(), Set.of());
    createLargeCSV("target/large.csv", 100000);
    createLargeCSV("target/too-large.csv", 101000);
    codesetId = restClient.createImportedCodeSet("AAA Tabs", "1.0", 0, 2, true, "\t", new ClassPathResource("AAA.tsv").getFile(), "text/csv");
    Long codesetId2 = restClient.createImportedCodeSet("AAA Large Tabs", "1.0", 0, 1, true, ",", new File("target/large.csv"), "text/csv");
    mapId = restClient.createMap("Testing Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);
    mapId2 = restClient.createMap("Testing Large Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId2);
  }

  private void createLargeCSV(String fileName, int rows) throws IOException {
    FileWriter out = new FileWriter(fileName);
    try (CSVPrinter printer = new CSVPrinter(out, CSVFormat.DEFAULT.builder()
      .setHeader("Source code", "Source display", "Target code", "Target display", "Relationship type code").build())) {
        for (int i = 0; i < rows; i++) {
          printer.printRecord(
            RandomStringUtils.randomAlphanumeric(10),
            RandomStringUtils.randomAlphanumeric(50),
            RandomStringUtils.randomAlphanumeric(10),
            RandomStringUtils.randomAlphanumeric(50),
            MappingRelationship.values()[new Random().nextInt(MappingRelationship.values().length)]
          );
        }
      }
  }

  /**
   * Tests valid TSV with content type text/tsv
   */
  @Test
  public void shouldCreateEntity() throws Exception {
    verifyImportedMap(0, 2, 3, 4, true, "\t", new ClassPathResource("AAA-mapimport.tsv").getFile(), "text/tsv", AAA_TSV_COLUMN_2_LIST, mapId);
  }

  /**
   * Tests valid TSV with content type text/tsv
   */
  @Test
  public void shouldCreateEntityCSV() throws Exception {
    verifyImportedMap(0, 2, 3, 4, true, ",", new ClassPathResource("AAA-mapimport.csv").getFile(), "text/csv", AAA_TSV_COLUMN_2_LIST, mapId);
  }

  /**
   * Tests invalid map Id
   */
  @Test
  public void failCreateEntityInvalidMapId() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("AAA-mapimport.tsv").getFile(),
        "text/tsv", mapId + 1000, 400, INVALID_MAP_ID_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Tests unauthorised used api call
   */
  @Test
  public void failCreateEntityUnauthorisedUser() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("AAA-mapimport.tsv").getFile(),
        "text/tsv", mapId, 403, UNAUTHORISED_USER_PROBLEM_URI, UNAUTHORISED_TEST_USER_SUBJECT);
  }

  /**
   * Tests TSV posted with invalid application/json type
   */
  @Test
  public void failCreateEntityIllegalContentType() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("AAA-mapimport.tsv").getFile(),
        "application/json", mapId, 406, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test empty file to text/plain
   */
  @Test
  public void failCreateEntityEmptyFileTextPlain() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("empty.txt").getFile(),
        "text/plain", mapId, 400, null, DEFAULT_TEST_USER_SUBJECT);
  }


  /**
   * Test empty file to text/csv
   */
  @Test
  public void failCreateEntityEmptyFileTextCsv() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("empty.txt").getFile(),
        "text/csv", mapId, 400, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test empty file to text/tsv
   */
  @Test
  public void failCreateEntityEmptyFileTextTsv() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("empty.txt").getFile(),
        "text/tsv", mapId, 400, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test rubbish file to text/plain
   */
  @Test
  public void failCreateEntityRubbishFileTextPlain() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("rubbish.tsv").getFile(),
        "text/plain", mapId, 400, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test rubbish file to text/plain
   */
  @Test
  public void failCreateEntityRubbishFileTsv() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("rubbish.tsv").getFile(),
        "text/tsv", mapId, 400, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test rubbish file to text/plain
   */
  @Test
  public void failCreateEntityRubbishFileCsv() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t", new ClassPathResource("rubbish.tsv").getFile(),
        "text/csv", mapId, 400, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test bad relationship column
   */
  @Test
  public void failCreateEntityBadRelationshipColumn() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 1, true, "\t", new ClassPathResource("AAA-mapimport.tsv").getFile(),
        "text/tsv", mapId, 400, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test invalid CSV format file (e.g. messed up delimiters/quotes) to text/csv
   */
  @Test
  public void failCreateEntityInvalidCsv() throws Exception {
    restClient.expectCreateImportedMapFail(0, 2, 3, 4, true, ",",
        new ClassPathResource("AAA_invalid_csv_mixeddelimiters.csv").getFile(), "text/csv", mapId,
        400, null, DEFAULT_TEST_USER_SUBJECT);
    restClient.expectCreateImportedMapFail(0, 2, 3, 4, true, ",",
        new ClassPathResource("AAA_invalid_csv_doublequotes.csv").getFile(), "text/csv", mapId,
        400, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test invalid TSV format file (e.g. messed up delimiters/quotes) to text/tsv
   */
  @Test
  public void failCreateEntityInvalidTsv() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, "\t",
        new ClassPathResource("AAA_invalid_csv_mixeddelimiters.csv").getFile(), "text/tsv", 400, null);
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, ",",
        new ClassPathResource("AAA_invalid_csv_doublequotes.tsv").getFile(), "text/tsv", 400, null);
  }

  /**
   * Test a large input file == 100k rows
   */
  @Test
  public void shouldCreateEntityFromLargeFile() throws Exception {
    verifyImportedMapRowTargerts(0, 2, 3, 4, true, ",", new File("target/large.csv"), "text/csv", mapId2);
  }

  /**
   * Test an input file > 100k rows
   */
  @Test
  public void failCreateEntityFromTooLargeFile() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, ",", new File("target/too-large.csv"),
        "text/csv", mapId, 400, TOO_LARGE_FILE_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test target code field length
   */
  @Test
  public void failCreateEntityTargetCodeTooLong() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport-too-long-targetcode.tsv").getFile(), "text/tsv",
      mapId, 400, CODE_SIZE_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test target display field length
   */
  @Test
  public void failCreateEntityTargetDisplayTooLong() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport-too-long-targetdisplay.tsv").getFile(), "text/tsv",
      mapId, 400, DISPLAY_SIZE_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Invalid target display index
   */
  @Test
  public void failCreateEntityTargetDisplayIndex() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 9, 4, true, "\t",
      new ClassPathResource("AAA-mapimport.tsv").getFile(), "text/tsv",
      mapId, 400, TAGET_DISPLAY_INDEX_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Invalid code index
   */
  @Test
  public void failCreateEntityCodeIndex() throws Exception {
    restClient.expectCreateImportedMapFail( 9, 2, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport.tsv").getFile(), "text/tsv",
      mapId, 400, CODE_INDEX_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Invalid target code index
   */
  @Test
  public void failCreateEntityTargetCodeIndex() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 9, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport.tsv").getFile(), "text/tsv",
      mapId, 400, TARGET_CODE_INDEX_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Invalid relationship index
   */
  @Test
  public void failCreateEntityRelationshipIndex() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 9, true, "\t",
      new ClassPathResource("AAA-mapimport.tsv").getFile(), "text/tsv",
      mapId, 400, RELATIONSHIP_INDEX_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test duplicate code/target-code values in file - expect failure
   */
  @Test
  public void failCreateEntityDuplicateCode() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport-duplicate.tsv").getFile(), "text/tsv",
      mapId, 400, DUPLICATE_CODE_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }


  /**
   * Test duplicate code/target-code values in file - expect failure
   */
  @Test
  public void failCreateEntityBlankCode() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport-blankcode.tsv").getFile(), "text/tsv",
      mapId, 400, CODE_BLANK_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test code value null/blank
   */
  @Test
  public void shouldNotFailCreateEntityBlankTargetCode() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport-blanktargetcode.tsv").getFile(), "text/tsv",
      mapId, 200, null, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Test display value null/blank
   */
  @Test
  public void failCreateEntityBlankDisplay() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport-blanktargetdisplay.tsv").getFile(), "text/tsv",
      mapId, 400, DISPLAY_BLANK_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);    
  }

  /**
   * Test invalid code in mapping file
   */
  @Test
  public void failCreateEntityInvalidCode() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t",
      new ClassPathResource("AAA-mapimport-invalidcode.tsv").getFile(), "text/tsv",
      mapId, 400, INVALID_DATA_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);    
  }

  /**
   * Test without header
   */
  @Test
  public void failCreateEntityWithoutHeader() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, false, "\t",
      new ClassPathResource("AAA-mapimport-noheader.tsv").getFile(), "text/tsv",
      mapId, 400, NO_HEADER_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  /**
   * Tests valid CSV file with ; (European) delimiter can be read
   */
  @Test
  public void shouldImportfileWithSemicolonDelimiter() throws Exception {
    verifyImportedMap(0, 2, 3, 4, true, ";", new ClassPathResource("AAA-mapimport-semicolon.csv")
      .getFile(), "text/tsv", AAA_TSV_COLUMN_2_LIST, mapId);
  }

  /**
   * Tests valid CSV file with invalid delimiter '\t' throws error
   */
  @Test
  public void shouldImportCSVFileWithTabDelimiter() throws Exception {
    restClient.expectCreateImportedMapFail( 0, 2, 3, 4, true, "\t",
    new ClassPathResource("AAA-mapimport.csv").getFile(), "text/tsv",
      mapId, 400, DELIMITER_PROBLEM_URI, DEFAULT_TEST_USER_SUBJECT);
  }

  private void verifyImportedMap(int codeColumnIndex, int targetColumnIndex, int targetDisplayColumnIndex,
  int relationshipColumnIndex, boolean hasHeader, String delimiter, File file, String fileType, String[] targetCodes, Long theMapId)
      throws JsonProcessingException, JsonMappingException, UnsupportedEncodingException, Exception {

    verifyImportedMapRowTargerts(codeColumnIndex, targetColumnIndex, targetDisplayColumnIndex, relationshipColumnIndex,
        hasHeader, delimiter, file, fileType, theMapId);

    List<MapRowTarget> mapRowTargets = restClient.givenDefaultUser().queryParam("mapId", theMapId)
        .get("/mapRowTargets/search/findByMapId")
        .then().statusCode(200)
        .body("content", hasSize(targetCodes.length))
        .extract().jsonPath().getList("content", MapRowTarget.class);

    for (MapRowTarget mapRowTarget : mapRowTargets) {
      assertThat(Arrays.asList(targetCodes).contains(mapRowTarget.getTargetCode()));
    }
  }

  private void verifyImportedMapRowTargerts(int codeColumnIndex, int targetColumnIndex, int targetDisplayColumnIndex,
      int relationshipColumnIndex, boolean hasHeader, String delimiter, File file, String fileType, Long theMapId) throws Exception {
    MappingImportResponse response = restClient.createImportedMap(codeColumnIndex, targetColumnIndex,
              targetDisplayColumnIndex, relationshipColumnIndex, hasHeader, delimiter, file, fileType, theMapId);

    assertThat(response.getInsertCount()).isGreaterThan(0);
    assertThat(response.getRecordCount()).isGreaterThanOrEqualTo(response.getInsertCount());
  }
}
