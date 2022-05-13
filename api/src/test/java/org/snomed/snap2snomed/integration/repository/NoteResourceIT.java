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

import java.io.IOException;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.Set;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import io.restassured.filter.log.LogDetail;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.greaterThan;

import static org.assertj.core.api.Assertions.assertThat;


@TestInstance(Lifecycle.PER_CLASS)
public class NoteResourceIT extends IntegrationTestBase {
  
  private Long projectId;
  private Long testImportedCodeSetId;
  private Long mapRowId;
  private Long mapId;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser("second-owner", "Another", "Bobby", "User", "another@user.com");

    projectId = restClient.createProject("Testing Project Title", "Testing Project Description",
        Set.of("second-owner"), Set.of(), Set.of());
    testImportedCodeSetId = restClient.createImportedCodeSet("map1 row code", "map1 row display", "test code set", "1.2.3", 34);
    mapId = createDefaultMap();
    mapRowId = restClient.getMapRowId(mapId, "map1 row code 1.");

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT, "second-owner"), new HashSet<String>(),
        new HashSet<String>());
  }

  @Test
  public void shouldCreateEntity() throws Exception {
    restClient.givenDefaultUser().body(restClient.createNoteJson(mapRowId, DEFAULT_TEST_USER_SUBJECT, "This is a test note"))
        .post("/notes/").then().statusCode(201);
  }

  @Test
  public void shouldListNotes() throws Exception {
    restClient.givenDefaultUser().body(restClient.createNoteJson(mapRowId, DEFAULT_TEST_USER_SUBJECT, "This is a test note"))
        .post("/notes/").then().statusCode(201);
    restClient.givenDefaultUser().get("/notes")
        .then().log().ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("content", hasSize(greaterThan(0)));
  }

  @Test
  public void shouldShowLatestNoteInMapView() throws Exception {
    Long mapRowId2 = restClient.getMapRowId(mapId, "map1 row code 2.");
    Long mapRowId3 = restClient.getMapRowId(mapId, "map1 row code 3.");

    String note1Modified = restClient.givenDefaultUser().body(restClient.createNoteJson(mapRowId2, DEFAULT_TEST_USER_SUBJECT, "Maprow 2 - This is a test note 1"))
        .post("/notes/").then().statusCode(201).extract().body().jsonPath().getString("modified");

    String note2Modified = restClient.givenDefaultUser().body(restClient.createNoteJson(mapRowId2, DEFAULT_TEST_USER_SUBJECT, "Maprow 2 - This is a test note 2"))
        .post("/notes/").then().statusCode(201).extract().body().jsonPath().getString("modified");

    String note3Modified = restClient.givenDefaultUser().body(restClient.createNoteJson(mapRowId2, DEFAULT_TEST_USER_SUBJECT, "Maprow 2 - This is a test note 3"))
        .post("/notes/").then().statusCode(201).extract().body().jsonPath().getString("modified");

    String note4Modified = restClient.givenDefaultUser().body(restClient.createNoteJson(mapRowId3, DEFAULT_TEST_USER_SUBJECT, "Maprow 3 - This is a test note 4"))
        .post("/notes/").then().statusCode(201).extract().body().jsonPath().getString("modified");

    assertThat(parseTime(note1Modified))
        .isBefore(parseTime(note2Modified))
        .isBefore(parseTime(note3Modified))
        .isBefore(parseTime(note4Modified));

    assertThat(parseTime(note2Modified))
        .isBefore(parseTime(note3Modified))
        .isBefore(parseTime(note4Modified));

    assertThat(parseTime(note3Modified))
        .isBefore(parseTime(note4Modified));

    restClient.givenDefaultUser().get("/mapView/" + mapId + "?sort=sourceIndex").then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("content", hasSize(20))
        .body("content[0].sourceCode", is("map1 row code 1."))
        .body("content[1].sourceCode", is("map1 row code 2."))
        .body("content[1].latestNote", is(note3Modified.replace("\"", "")))
        .body("content[2].sourceCode", is("map1 row code 3."))
        .body("content[2].latestNote", is(note4Modified.replace("\"", "")));

    restClient.givenDefaultUser().get("/mapView/" + mapId + "?sort=latestNote&page=1").then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("content", hasSize(14))
        .body("content[0].latestNote", nullValue())
        .body("content[12].sourceCode", is("map1 row code 2."))
        .body("content[12].latestNote", is(note3Modified.replace("\"", "")))
        .body("content[13].sourceCode", is("map1 row code 3."))
        .body("content[13].latestNote", is(note4Modified.replace("\"", "")));

    restClient.givenDefaultUser().get("/mapView/" + mapId + "?sort=latestNote,desc").then().log()
        .ifValidationFails(LogDetail.BODY).statusCode(200)
        .body("content", hasSize(20))
        .body("content[0].sourceCode", is("map1 row code 3."))
        .body("content[0].latestNote", is(note4Modified.replace("\"", "")))
        .body("content[1].sourceCode", is("map1 row code 2."))
        .body("content[1].latestNote", is(note3Modified.replace("\"", "")));
  }


  private Long createDefaultMap() throws JsonProcessingException {
    return restClient.createMap("Testing Map Version",
        "http://snomed.info/sct/32506021000036107/version/20210531", "http://map.test.toscope",
        projectId, testImportedCodeSetId);
  }  
 
  private ZonedDateTime parseTime(String theTime) {
    return ZonedDateTime.parse(theTime.replace("\"", ""));
  }

}
