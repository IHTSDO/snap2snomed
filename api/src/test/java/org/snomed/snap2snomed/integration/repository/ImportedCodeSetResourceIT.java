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

package org.snomed.snap2snomed.integration.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.snomed.snap2snomed.service.CodeSetImportService.TOO_LARGE_FILE_PROBLEM_URI;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.snomed.snap2snomed.model.ImportedCode;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

@TestInstance(Lifecycle.PER_CLASS)
public class ImportedCodeSetResourceIT extends IntegrationTestBase {

  private static final String DISPLAY_INDEX_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/invalid-display-index";
  private static final String CODE_INDEX_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/invalid-code-index";
  private static final String DISPLAY_BLANK_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/display-blank";
  private static final String CODE_BLANK_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/code-blank";
  private static final String DUPLICATE_CODE_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/duplicate-code";
  private static final String CODE_SIZE_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/code-size";
  private static final String DISPLAY_SIZE_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/display-size";
  private static final String DELIMITER_PROBLEM_URI = "http://snap2snomed.app/problem/codeset-import/invalid-delimiter";

  private static final String CONSTRAINT_VALIDATION_PROBLEM_URI = "https://zalando.github.io/problem/constraint-violation";

  private static final String[] AAA_TSV_CODE_LIST =
      {"1245324534654236135432346435652345346432546454354", "210632005", "300138002", "315594003", "34014006", "34436003", "38341003",
          "444019000", "47505003", "50711007", "75478009", "77176002", "85224001"};

  private static final String[] AAA_TSV_ONECOLUMN_CODE_LIST = {
      "afba878d3ea1c0a427b8b5b4d1892311", "943490c8b63a5068854aed033a051ff1", "d8ab0ed86f8cffdeb8a1007bf650c367",
      "9c6759a8faa01a13df7fa5fe8bdc80af",
      "9f1fbac53f9d3c24ab74be3c683219ee", "22b881306382d7880c2662c63282767e", "2a9a20e81af729552b123653a37e992c",
      "a004f8a3709e954782e2b61dfc0264e8",
      "0d708f7fb6430d67bab39a4c47dac95f", "6375083d37397ba1b06c197056201209", "060ff855908400b7902eef0a70c136fb",
      "c387f6ec35c56e33e6ab9453c3e2052c",
      "d87fe6adde542c1936f8c7ef88771e21"};

  private static final String[] AAA_ONECOL_CODE_LIST = {
      "e46a583b303d5f3ddc226f18564dec28", "8a1f0d1e3eb7b138691b83bd8d15f19b", "7bf00c8fd4e7f745fc060450394913df",
      "8bb66db622493bb0f181accd80ae8d27",
      "cd31e469f814b161cef7bd4f43ac708b", "c32fbaf84adfa4ac3362a89ff22635d4", "d197a15e2b0b3118917a87c7ea07dc02",
      "620a67ac832a85fb9a9548080cd8e8ab",
      "4997f17df5eac2544d718fe0eabd3640", "a0c8909fafb82791c22174fe72517677", "64c9787d64efa7951c649cc2ba04bbfe",
      "24b89fe792c3c37e326bb8c91a1881fb",
      "37027fb916db30c7698fac93815bb4cd"
  };

  private static final String[] AAA_TSV_COLUMN_1_LIST = {
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer fringilla suscipit sem, id facilisis erat dictum non. In sodales, orci eu maximus sollicitudin, nulla nisl viverra quam, at interdum felis mi in quam. Cras feugiat erat sit amet diam malesuada, sed volutpat risus viverra. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Integer tempor augue sit amet nisl porttitor euismod vitae sed nulla. Nam quis lacus lobortis nisl accumsan tincidunt. Nunc venenatis sit.",
      "àáâäæãåā", "èéêëēėę", "îïíīįì", "ôöòóœøōõő", "ûüùúūű",
      "2015-11-28", "2015-12-02", "2015-12-01", "2015-11-30", "2015-12-01", "2015-11-28", "2015-12-02"};

  private static final String[] AAA_TSV_COLUMN_2_LIST = {"14:22:27", "22:33:20", "16:23:11", "09:32:09", "04:30:43", "01:36:55", "14:28:43",
      "01:12:19", "00:50:48", "22:20:59", "08:41:29", "14:33:46", "23:53:46"};

  private static final String[] AAA_TSV_ONECOLUMN_LIST = {
      "1245324534654236135432346435652345346432546454354	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer fringilla suscipit sem,"
          +
          " id facilisis erat dictum non. In sodales, orci eu maximus sollicitudin, nulla nisl viverra quam, at interdum felis mi in quam. Cras "
          +
          "feugiat erat sit amet diam malesuada, sed volutpat risus viverra. Orci varius natoque penatibus et magnis dis parturient montes, nascetur "
          +
          "ridiculus mus. Integer tempor augue sit amet nisl porttitor euismod vitae sed nulla.	14:22:27", "210632005	àáâäæãåā	22:33:20",
      "300138002	èéêëēėę	16:23:11", "315594003	îïíīįì	09:32:09", "34014006	ôöòóœøōõő	04:30:43", "34436003	ûüùúūű	01:36:55",
      "38341003	2015-11-28	14:28:43", "444019000	2015-12-02	01:12:19", "47505003	2015-12-01	00:50:48",
      "50711007	2015-11-30	22:20:59",
      "75478009	2015-12-01	08:41:29", "77176002	2015-11-28	14:33:46", "85224001	2015-12-02	23:53:46"};

  private static final String[] AAA_CSV_CODE_LIST = {"1245324534654236135432346435652345346432546454354", "210632005", "300138002",
      "315594003", "34014006", "34436003", "38341003",
      "444019000", "47505003", "50711007", "75478009", "77176002", "85224001"};

  private static final String[] AAA_CSV_COLUMN_1_LIST = {
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer fringilla suscipit sem, id facilisis erat dictum non. In sodales, orci eu maximus sollicitudin, nulla nisl viverra quam, at interdum felis mi in quam. Cras feugiat erat sit amet diam malesuada, sed volutpat risus viverra. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Integer tempor augue sit amet nisl porttitor euismod vitae sed nulla. Nam quis lacus lobortis nisl accumsan tincidunt. Nunc venenatis sit.",
      "àáâäæãåā", "èéêëēėę", "îïíīįì", "ôöòóœøōõő", "ûüùúūű",
      "2015-11-28", "2015-12-02", "2015-12-01", "2015-11-30", "2015-12-01", "2015-11-28", "2015-12-02"};

  private static final String[] AAA_CSV_COLUMN_2_LIST = {"14:22:27", "22:33:20", "16:23:11", "09:32:09", "04:30:43", "01:36:55", "14:28:43",
      "01:12:19", "00:50:48", "22:20:59", "08:41:29", "14:33:46", "23:53:46"};

  private static final String ANOTHER_USER = "another-user";
  private static final String PROJECT_USER = "project-user";

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateAdminUser(DEFAULT_TEST_ADMIN_USER_SUBJECT, "A1", "Admin", "Admin", "admin@user.com");
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(ANOTHER_USER, "Bob", "Bobby", "Bob", "u2@csiro.au");
    restClient.createOrUpdateUser(PROJECT_USER, "Bob2", "Bobby2", "Bob2", "u3@csiro.au");
  }

  /**
   * Tests valid TSV with content type text/tsv - includes duplicate display text scenario
   */
  @Test
  public void shouldCreateEntity() throws Exception {
    verifyCreatedImportedCodeSet("AAA Tabs", "1.0", 0, 2, true, "\t", new ClassPathResource("AAA.tsv").getFile(), "text/tsv",
        AAA_TSV_CODE_LIST, AAA_TSV_COLUMN_2_LIST);
  }

  /**
   * Tests invalid metadata - no version
   */
  @Test
  public void failCreateEntityBadDetails() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", null, 0, 2, true, "\t", new ClassPathResource("AAA.tsv").getFile(), "text/tsv",
        400,
        CONSTRAINT_VALIDATION_PROBLEM_URI);
  }


  /**
   * Tests TSV posted with invalid application/json type
   */
  @Test
  public void failCreateEntityIllegalContentType() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, "\t", new ClassPathResource("AAA.tsv").getFile(),
        "application/json", 406, null);
  }

  /**
   * Test empty file to text/plain
   */
  @Test
  public void failCreateEntityEmptyFileTextPlain() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, null, new ClassPathResource("empty.txt").getFile(),
        "text/plain", 400, null);
  }


  /**
   * Test empty file to text/csv
   */
  @Test
  public void failCreateEntityEmptyFileTextCsv() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, null, new ClassPathResource("empty.txt").getFile(),
        "text/csv", 400, null);
  }

  /**
   * Test empty file to text/tsv
   */
  @Test
  public void failCreateEntityEmptyFileTextTsv() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, null, new ClassPathResource("empty.txt").getFile(),
        "text/tsv", 400, null);
  }


  /**
   * Test rubbish file to text/plain
   */
  @Test
  public void failCreateEntityRubbishFileTextPlain() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, null, new ClassPathResource("rubbish.tsv").getFile(),
        "text/plain", 400, null);
  }

  /**
   * Test rubbish file to text/tsv
   */
  @Test
  public void failCreateEntityRubbishFileTsv() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, null, new ClassPathResource("rubbish.tsv").getFile(),
        "text/tsv", 400, null);
  }

  /**
   * Test rubbish file to text/csv
   */
  @Test
  public void failCreateEntityRubbishFileCsv() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, null, new ClassPathResource("rubbish.tsv").getFile(),
        "text/csv", 400, null);
  }

  /**
   * Test invalid CSV format file (e.g. messed up delimiters/quotes) to text/csv
   */
  @Test
  public void failCreateEntityInvalidCsv() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, ",",
        new ClassPathResource("AAA_invalid_csv_mixeddelimiters.csv").getFile(), "text/csv", 400, null);
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, ",",
        new ClassPathResource("AAA_invalid_csv_doublequotes.csv").getFile(), "text/csv", 400, null);
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
    verifyCreatedImportedCodeSet("Large", "1.0", 0, 1, true, ",", new ClassPathResource("large.csv").getFile(), "text/csv");
  }

  /**
   * Test an input file > 100k rows
   */
  @Test
  public void failCreateEntityFromTooLargeFile() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 1, true, ",", new ClassPathResource("too-large.csv").getFile(),
        "text/csv", 400, TOO_LARGE_FILE_PROBLEM_URI);
  }

  /**
   * Test code field length
   */
  @Test
  public void failCreateEntityCodeTooLong() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, ",", new ClassPathResource("AAA_code_too_long.csv").getFile(),
        "text/csv", 400, CODE_SIZE_PROBLEM_URI);
  }

  /**
   * Test display field length
   */
  @Test
  public void failCreateEntityDisplayTooLong() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 1, true, ",", new ClassPathResource("AAA_display_too_long.csv").getFile(),
        "text/csv", 400, DISPLAY_SIZE_PROBLEM_URI);
  }

  /**
   * Invalid display index
   */
  @Test
  public void failCreateEntityDisplayIndex() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 4, true, ",", new ClassPathResource("AAA.csv").getFile(),
        "text/csv", 400, DISPLAY_INDEX_PROBLEM_URI);
  }

  /**
   * Invalid code index
   */
  @Test
  public void failCreateEntityCodeIndex() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 4, 2, true, ",", new ClassPathResource("AAA.csv").getFile(),
        "text/csv", 400, CODE_INDEX_PROBLEM_URI);
  }

  /**
   * Test duplicate code values in file - expect failure
   */
  @Test
  public void failCreateEntityDuplicateCode() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, ",", new ClassPathResource("AAA_duplicate_code.csv").getFile(),
        "text/csv", 400, DUPLICATE_CODE_PROBLEM_URI);
  }

  /**
   * Test code value null/blank
   */
  @Test
  public void failCreateEntityBlankCode() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, ",", new ClassPathResource("AAA_blank_code.csv").getFile(),
        "text/csv", 400, CODE_BLANK_PROBLEM_URI);
  }

  /**
   * Test display value null/blank
   */
  @Test
  public void failCreateEntityBlankDisplay() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, ",",
        new ClassPathResource("AAA_blank_display_term.csv").getFile(), "text/csv", 400, DISPLAY_BLANK_PROBLEM_URI);
  }

  /**
   * Test with/without header
   */
  @Test
  public void shouldCreateEntityWithoutHeader() throws Exception {
    verifyCreatedImportedCodeSet("AAA Tabs", "1.0", 0, 2, false, "\t", new ClassPathResource("AAA_no_header.tsv").getFile(), "text/tsv",
        AAA_TSV_CODE_LIST, AAA_TSV_COLUMN_2_LIST);
  }

  @Test
  public void shouldCreateEntityCsvWithoutHeader() throws Exception {
    verifyCreatedImportedCodeSet("AAA Tabs", "1.0", 0, 1, false, ",", new ClassPathResource("AAA_no_header.csv").getFile(), "text/csv",
        AAA_TSV_CODE_LIST, AAA_CSV_COLUMN_1_LIST);
  }

  @Test
  public void shouldCreateEntityCsvMixedHeader() throws Exception {
    String filename = "Pathology Organisms only.csv";

    Resource fileResource = new ClassPathResource(filename);

    List<String> codes = new ArrayList<>();
    List<String> labels = new ArrayList<>();

    try (BufferedReader reader = new BufferedReader(new InputStreamReader(fileResource.getInputStream()));
        CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().withAllowMissingColumnNames().parse(reader)) {

      for (CSVRecord csvRecord : parser) {
        codes.add(csvRecord.get(0));
        labels.add(csvRecord.get(1));
      }

    }

    verifyCreatedImportedCodeSet("AAA comma", "1.0", 0, 1, true, ",", fileResource.getFile(), "text/csv",
        codes.toArray(new String[0]), labels.toArray(new String[0]));
  }

  @Test
  public void shouldCreateEntitySampleCsv() throws Exception {
    String filename = "Pathology Organisms 202103.csv";

    Resource fileResource = new ClassPathResource(filename);

    List<String> codes = new ArrayList<>();
    List<String> labels = new ArrayList<>();

    try (BufferedReader reader = new BufferedReader(new InputStreamReader(fileResource.getInputStream()));
        CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().withAllowMissingColumnNames().parse(reader)) {

      for (CSVRecord csvRecord : parser) {
        codes.add(csvRecord.get(0));
        labels.add(csvRecord.get(1));
      }

    }

    verifyCreatedImportedCodeSet("AAA comma", "1.0", 0, 1, true, ",", fileResource.getFile(), "text/csv",
        codes.toArray(new String[0]), labels.toArray(new String[0]));
  }

  /**
   * Tests valid file with one column can be read
   */
  @Test
  public void shouldImportfileOneColumn() throws Exception {
    verifyCreatedImportedCodeSet("AAA comma", "1.0", 0, 0, true, null, new ClassPathResource("AAA_ONECOL.csv").getFile(), "text/plain",
        AAA_ONECOL_CODE_LIST, AAA_TSV_CODE_LIST);
  }

  /**
   * Tests valid TSV file read as one column when delimiter is set to null
   */
  @Test
  public void shouldImportfileWithoutDelimiter() throws Exception {
    verifyCreatedImportedCodeSet("AAATabs Onecol", "1.0", 0, 0, true, null, new ClassPathResource("AAA.tsv").getFile(), "text/tsv",
        AAA_TSV_ONECOLUMN_CODE_LIST, AAA_TSV_ONECOLUMN_LIST);
  }

  /**
   * Tests valid CSV file with ; (European) delimiter can be read
   */
  @Test
  public void shouldImportfileWithSemicolonDelimiter() throws Exception {
    verifyCreatedImportedCodeSet("AAA semicolon", "1.0", 0, 2, true, ";", new ClassPathResource("AAA-semi.csv").getFile(), "text/tsv",
        AAA_TSV_CODE_LIST, AAA_TSV_COLUMN_2_LIST);
  }

  /**
   * Tests valid CSV file with invalid delimiter '\t' throws error
   */
  @Test
  public void shouldImportCSVFileWithTabDelimiter() throws Exception {
    restClient.expectCreateImportedCodeSetFail("badAAA", "2", 0, 2, true, "\t",
        new ClassPathResource("AAA-semi.csv").getFile(), "text/tsv", 400, DELIMITER_PROBLEM_URI);
  }

  /**
   * Tests that other users cannot see the imported codesets
   */
  @Test
  public void otherUserShouldNotSeeImportedCodeSystem() throws Exception {
    long id = immportCodeSetForUser(DEFAULT_TEST_USER_SUBJECT, "AAA semicolon - defaultuser", "1.0", 0, 2, true, ";", new ClassPathResource("AAA-semi.csv").getFile(), "text/tsv");
    restClient.givenUser(ANOTHER_USER).get("/importedCodeSets/search/byIdForOwner?id=" + id)
        .then().statusCode(404);
    restClient.givenUser(DEFAULT_TEST_ADMIN_USER_SUBJECT).get("/importedCodeSets/search/byIdForOwner?id=" + id)
        .then().statusCode(200);
    restClient.givenUser(ANOTHER_USER).get("/importedCodeSets")
        .then().statusCode(200)
        .body("page.totalElements", is(0));
    restClient.givenDefaultUser().get("/importedCodeSets")
        .then().statusCode(200)
        .body("page.totalElements", greaterThanOrEqualTo(1));
  }

  /**
   * Non project member should not be able to search by importedCodeSet
   */
  @Test
  public void nonProjectUserShouldNotBeAbleToSearchByImportedCodeSet() throws Exception {
    final long id = verifyCreatedImportedCodeSet("AAA semicolon version 2", "2.0", 0, 2, true, ";", new ClassPathResource("AAA-semi.csv").getFile(), "text/tsv");
    restClient.givenUser(ANOTHER_USER).queryParam("importedCodeSet", "/importedCodeSets/" + id)
        .get("/importedCodes/search/findByImportedCodeSet")
        .then().statusCode(200)
        .body("content", hasSize(1))
        .body("content[0].value", hasSize(0));
    }

  private void verifyCreatedImportedCodeSet(String name, String version, int codeColumnIndex, int displayColumnIndex, boolean hasHeader,
      String delimiter, File file, String fileType, String[] codes, String[] displayTerms)
      throws JsonProcessingException, JsonMappingException, UnsupportedEncodingException, Exception {

    final long id = verifyCreatedImportedCodeSet(name, version, codeColumnIndex, displayColumnIndex, hasHeader, delimiter, file, fileType);

    List<ImportedCode> importedCodes = restClient.givenDefaultUser().queryParam("importedCodeSet", "/importedCodeSets/" + id)
        .get("/importedCodes/search/findByImportedCodeSet")
        .then().statusCode(200)
        .body("content", hasSize(codes.length))
        .extract().jsonPath().getList("content", ImportedCode.class);

    for (ImportedCode code : importedCodes) {
      int index = Math.toIntExact(code.getIndex());
      assertThat(code.getCode()).isEqualTo(codes[index - 1]);
      assertThat(code.getDisplay()).isEqualTo(displayTerms[index - 1]);
    }
  }

  private long verifyCreatedImportedCodeSet(String name, String version, int codeColumnIndex, int displayColumnIndex, boolean hasHeader,
      String delimiter, File file, String fileType) throws Exception {
    long id = restClient.createImportedCodeSet(name, version, codeColumnIndex, displayColumnIndex, hasHeader, delimiter, file, fileType);

    restClient.givenDefaultUser().get("/importedCodeSets/search/byIdForOwner?id=" + id)
        .then().statusCode(200)
        .body("id", is((int) id))
        .body("name", is(name))
        .body("version", is(version));

    return id;
  }

  
  private long immportCodeSetForUser(String subject, String name, String version, int codeColumnIndex, int displayColumnIndex, boolean hasHeader,
      String delimiter, File file, String fileType) throws Exception {
    long id = restClient.createImportedCodeSet(subject, name, version, codeColumnIndex, displayColumnIndex, hasHeader, delimiter, file, fileType);

    restClient.givenUser(subject).get("/importedCodeSets/search/byIdForOwner?id=" + id)
        .then().statusCode(200)
        .body("id", is((int) id))
        .body("name", is(name))
        .body("version", is(version));

    return id;
  }
}
