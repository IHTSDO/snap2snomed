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

import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.restassured.filter.log.LogDetail;
import java.io.IOException;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.integration.IntegrationTestBase;

@TestInstance(Lifecycle.PER_CLASS)
public class MapResourceIT extends IntegrationTestBase {

  private static final String SECOND_OWNER = "second-owner";
  private static final String NO_ROLE = "no-role";
  private static final String MEMBER = "member";
  private static final String GUEST = "guest";
  private static final String NOT_AUTHORISED_URL = "http://snap2snomed.app/problem/not-authorised";
  private Long projectId;
  private Long testImportedCodeSetId;
  private Long testImportedCodeSet2Id;
  private Long mapId;
  private Long mapId2;

  Instant start;

  @Override
  protected void beforeTests() throws IOException {
    start = Instant.now();
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(SECOND_OWNER, "Another", "Bobby", "User", "another@user.com");
    restClient.createOrUpdateUser(NO_ROLE, "No", "Bobby", "Role", "no-role@user.com");
    restClient.createOrUpdateUser(MEMBER, "Member", "Bobby", "Role", "member-role@user.com");
    restClient.createOrUpdateUser(GUEST, "Guest", "Bobby", "Role", "guest-role@user.com");

    projectId = restClient.createProject("Testing Project Title", "Testing Project Description",
        Set.of(SECOND_OWNER), Set.of(MEMBER), Set.of(GUEST));
    testImportedCodeSetId = restClient.createImportedCodeSet("map1 row code", "map1 row display", "test code set", "1.2.3", 34);
    testImportedCodeSet2Id = restClient.createImportedCodeSet("map2 row code", "map2 row display", "test code set", "1.2.3", 34);
    mapId = createDefaultMap();
    try {
      Thread.sleep(1000);
    } catch (InterruptedException e) {
      throw new RuntimeException("Failed to wait");
    }
    mapId2 = createDefaultMap2();

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT, SECOND_OWNER), Set.of(MEMBER), Set.of(GUEST));

  }

  @Test
  public void shouldCreateEntity() throws Exception {
    Long mapRowId = restClient.getMapRowId(mapId, "map1 row code 1.");

    restClient.givenDefaultUser().get("/maps/" + mapId).then().statusCode(200)
        .body("mapVersion", is("Testing Map Version"))
        .body("toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
        .body("toScope", is("http://map.test.toscope"));

    restClient.givenDefaultUser()
        .queryParam("projection", "withLatestNote")
        .get("/mapRows/search/findMapRowsByMapId?mapId=" + mapId).then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        // This is created by restClient.createImportedCodeSet
        .body("content[0].sourceCode.code", is("map1 row code 1."))
        .body("content[0].sourceCode.display", is("map1 row display 1"))
        .body("content[0].sourceCode.latestNote", nullValue());

    Long noteId = restClient.createNote(DEFAULT_TEST_USER_SUBJECT, mapRowId, "This is a test note");
    restClient.givenDefaultUser().get("/notes/" + noteId).then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("noteText", is("This is a test note"));

    restClient.givenDefaultUser()
        .queryParam("projection", "withLatestNote")
        .get("/mapRows/search/findMapRowsByMapId?mapId=" + mapId).then().statusCode(200)
        .body("content[0].sourceCode.code", is("map1 row code 1."))
        .body("content[0].sourceCode.display", is("map1 row display 1"))
        .body("content[0].latestNote", not(emptyString()));
  }

  @Test
  public void failCreateEntityNotProjectOwner() throws Exception {
    Long pId = restClient.createProject("Testing Project Title owner test", "Testing Project Description",
        Set.of(SECOND_OWNER), Set.of(MEMBER), Set.of(GUEST));

    restClient.givenUser(NO_ROLE)
        .queryParam("projection", "listView")
        .body(restClient.createMapJson("Testing Map Versio 3n",
            "http://snomed.info/sct/32506021000036107/version/2021053", "http://map.test.toscope",
            pId, testImportedCodeSetId))
        .post("/maps").then().statusCode(403)
        .body("type", is(NOT_AUTHORISED_URL));
  }

  @Test
  public void failCreateEntityBadVersion() throws Exception {
    restClient.givenDefaultUser()
        .body(restClient.createMapJson("Testing Map Version",
            "http://snomed.info/sct/32506021000036107/version/2021053", "http://map.test.toscope",
            projectId, testImportedCodeSetId))
        .post("/maps").then().log().ifValidationFails(LogDetail.BODY).statusCode(400)
        .body("violations[0].field", is("toVersion"))
        .body("violations[0].message", is("Map version must be a SNOMED CT version URI"));
  }

	@Test
	public void shouldUpdateEntity() throws Exception {
    final String path = "/maps/" + mapId;

    validateNumberOfRevisions(path, 1);
    validateCreatedAndModifiedAudit(start, null, path, DEFAULT_TEST_USER_SUBJECT, DEFAULT_TEST_USER_SUBJECT);

    final Instant now = Instant.now();
    restClient.givenDefaultUser()
        .body(restClient.createMapJson(mapId, "Testing Map Version Update",
            "http://snomed.info/sct/32506021000036107/version/20210731", "http://map.test.toscope-updated",
            projectId, testImportedCodeSetId))
        .put(path).then().log().ifValidationFails(LogDetail.BODY).statusCode(200);

    validateCreatedAndModifiedAudit(start, now, path, DEFAULT_TEST_USER_SUBJECT, DEFAULT_TEST_USER_SUBJECT);

    validateNumberOfRevisions(path, 2);

    restClient.givenDefaultUser().get(path).then().statusCode(200)
        .body("mapVersion", is("Testing Map Version Update"))
        .body("toVersion", is("http://snomed.info/sct/32506021000036107/version/20210731"))
        .body("toScope", is("http://map.test.toscope-updated"));

    restClient.givenDefaultUser()
        .queryParam("projection", "withLatestNote")
        .get("/mapRows/search/findMapRowsByMapId?mapId=" + mapId).then().statusCode(200)
        .body("content", hasSize(34))
        .body("content[0].sourceCode.code", is("map1 row code 1."))
        .body("content[0].sourceCode.display", is("map1 row display 1"))
        .body("content[0].latestNote", not(emptyString()));
  }

  @Test
  public void failUpdateEntityNotProjectOwner() throws Exception {
    final String path = "/maps/" + mapId;

    restClient.givenUser(MEMBER)
        .body(restClient.createMapJson(mapId, "Testing Map Version Update",
            "http://snomed.info/sct/32506021000036107/version/20210731", "http://map.test.toscope-updated",
            projectId, testImportedCodeSetId))
        .put(path).then().log().all().statusCode(403);
    restClient.givenUser(GUEST)
        .body(restClient.createMapJson(mapId, "Testing Map Version Update",
            "http://snomed.info/sct/32506021000036107/version/20210731", "http://map.test.toscope-updated",
            projectId, testImportedCodeSetId))
        .put(path).then().log().all().statusCode(403);
    restClient.givenUser(NO_ROLE)
        .body(restClient.createMapJson(mapId, "Testing Map Version Update",
            "http://snomed.info/sct/32506021000036107/version/20210731", "http://map.test.toscope-updated",
            projectId, testImportedCodeSetId))
        .put(path).then().log().all().statusCode(403);
  }

  @Test
  public void failUpdateEntityBadVersion() throws Exception {
    restClient.givenDefaultUser()
        .body(restClient.createMapJson(mapId, "Testing Map Version Update",
            "http://snomed.info/sct/32506021000036107/version/2021053", "http://map.test.toscope-updated",
            projectId, testImportedCodeSetId))
        .put("/maps/"+ mapId).then().log().ifValidationFails(LogDetail.BODY).statusCode(400)
        .body("violations[0].field", is("toVersion"))
        .body("violations[0].message", is("Map version must be a SNOMED CT version URI"));        
  }  

	@Test
	public void shouldDeleteEntity() throws Exception {
    restClient.givenDefaultUser()
        .body(restClient.createMapJson("Testing Map Version",
            "http://snomed.info/sct/32506021000036107/version/2021053", "http://map.test.toscope",
            projectId, testImportedCodeSetId))
        .delete("/maps/" + mapId).then().log().ifValidationFails(LogDetail.BODY).statusCode(405);
	}

	@Test
	public void shouldRetrieveSortedMaps() throws Exception {
    restClient.givenUser(SECOND_OWNER)
        .queryParam("projection", "withLatestNote").log().all()
        .get("/mapRows/search/findMapRowsByMapId?mapId=" + mapId).then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("content[0].sourceCode.code", is("map1 row code 1."))
        .body("content[0].sourceCode.display", is("map1 row display 1"))
        .body("content[0].sourceCode.latestNote", nullValue());

    restClient.givenUser(SECOND_OWNER)
        .queryParam("projection", "withLatestNote").log().all()
        .get("/mapRows/search/findMapRowsByMapId?mapId=" + mapId2).then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("content[0].sourceCode.code", is("map2 row code 1."))
        .body("content[0].sourceCode.display", is("map2 row display 1"))
        .body("content[0].sourceCode.latestNote", nullValue());

    restClient.givenUser(SECOND_OWNER)
        .queryParam("projection", "listView")
        .get("/projects/"+projectId+"/maps").then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("content[0].mapVersion", is("Testing Map Version"))
        .body("content[0].toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
        .body("content[0].toScope", is("http://map.test.toscope"))
        .body("content[0].id", is(mapId.intValue()))
        .body("content[1].mapVersion", is("Testing Map2 Version"))
        .body("content[1].toVersion", is("http://snomed.info/sct/32506021000036107/version/20210731"))
        .body("content[1].toScope", is("http://map.test2.toscope"))
        .body("content[1].id", is(mapId2.intValue()));

    restClient.givenUser(SECOND_OWNER)
        .queryParam("projection", "listView")
        .get("/maps?project=" + projectId + "&sort=modified,desc").then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("content[1].mapVersion", is("Testing Map Version"))
        .body("content[1].toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
        .body("content[1].toScope", is("http://map.test.toscope"))
        .body("content[1].id", is(mapId.intValue()))
        .body("content[0].mapVersion", is("Testing Map2 Version"))
        .body("content[0].toVersion", is("http://snomed.info/sct/32506021000036107/version/20210731"))
        .body("content[0].toScope", is("http://map.test2.toscope"))
        .body("content[0].id", is(mapId2.intValue()));
  }

  private Long createDefaultMap() throws JsonProcessingException {
    return restClient.createMap("Testing Map Version",
        "http://snomed.info/sct/32506021000036107/version/20210531", "http://map.test.toscope",
        projectId, testImportedCodeSetId);
  }
  private Long createDefaultMap2() throws JsonProcessingException {
    return restClient.createMap("Testing Map2 Version",
        "http://snomed.info/sct/32506021000036107/version/20210731", "http://map.test2.toscope",
        projectId, testImportedCodeSet2Id);
  }
}
