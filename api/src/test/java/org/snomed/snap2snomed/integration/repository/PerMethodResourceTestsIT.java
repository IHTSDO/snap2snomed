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

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasEntry;
import static org.hamcrest.Matchers.is;

import java.io.File;
import java.io.IOException;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.springframework.core.io.ClassPathResource;

@TestInstance(Lifecycle.PER_METHOD)
public class PerMethodResourceTestsIT extends IntegrationTestBase {

  private static final String PROJECT_USER = "project-import-user";

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateAdminUser(DEFAULT_TEST_ADMIN_USER_SUBJECT, "A1", "Admin", "Admin", "admin@user.com");
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(PROJECT_USER, "Bob2", "Bobby2", "Bob2", "u3@csiro.au");
  }

  /**
   * Tests that users can see an imported codeset who is associated with a project that has the importedcodset as a base
   */
  @Test
  public void projectMemberAndAdminShouldSeeImportedCodeSystem() throws Exception {

    long projectId = restClient.createProject("ProjectDemo", "Demo Project", Set.of(DEFAULT_TEST_USER_SUBJECT, PROJECT_USER), Set.of(), Set.of());

    final String codeSetName = "AAA semicolon - defaultuser - projecttest";

    long codesetId = immportCodeSetForUser(DEFAULT_TEST_USER_SUBJECT, codeSetName, "1.0", 0, 2, true, ";", new ClassPathResource("AAA-semi.csv").getFile(), "text/tsv");

    restClient.createMap("Testing Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);

    restClient.givenUser(PROJECT_USER).get("/importedCodeSets")
        .then().statusCode(200)
        .body("content", hasItem(hasEntry("name", codeSetName)));

    restClient.givenUser(DEFAULT_TEST_ADMIN_USER_SUBJECT).get("/importedCodeSets")
        .then().statusCode(200)
        .body("content", hasItem(hasEntry("name", codeSetName)));
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
