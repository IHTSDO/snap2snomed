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

import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.core.Is.is;

import io.restassured.specification.RequestSpecification;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.Before;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.snomed.snap2snomed.model.MapRowTarget;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.model.enumeration.TaskType;

@TestInstance(Lifecycle.PER_CLASS)
public class MapRowTargetResourceIT extends IntegrationTestBase {

  private static final String NO_ROLE_TEST_USER = "no-role-user";
  private static final String MEMBER_TEST_USER = "member-user";
  private static final String GUEST_TEST_USER = "guest-user";

  private Long projectId;
  private Long codesetId;
  private Long mapId;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(NO_ROLE_TEST_USER, "Frank", "Bobby", "Smith", "frank.smith@user.com");
    restClient.createOrUpdateUser(MEMBER_TEST_USER, "Member", "Bobby", "User", "member@user.com");
    restClient.createOrUpdateUser(GUEST_TEST_USER, "Guest", "Bobby", "User", "guest@user.com");

    projectId = restClient.createProject("Testing Project Title", "Testing Project Description",
        Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));

    codesetId = restClient.createImportedCodeSet("test code set", "1.2.3", 34);

    mapId = restClient.createMap("Testing Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);
  }

  @BeforeEach
  public void beforeEach() {
    restClient.deleteAllTasks();
  }

  @Test
  public void shouldGetByMapIdAndSourceCode() throws Exception {
    long taskId = restClient.createTask(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1");

    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 1.", "target", "display",
        MappingRelationship.TARGET_EQUIVALENT, false);

    restClient.givenDefaultUser()
        .queryParam("projection", "targetView")
        .queryParam("row.sourceCode.index", "1")
        .queryParam("row.map.id", mapId).log().all()
        .get("/mapRowTargets")
        .then().log().body().statusCode(200)
        .body("content", hasSize(1))
        .body("content[0].source.code", is("map row code 1."))
        .body("content[0].mapping.id", is(mapId.intValue()))
        .body("content[0].row.id", is((int) restClient.getMapRowId(mapId, "map row code 1.")))
        .body("content[0].targetCode", is("target"))
        .body("content[0].targetDisplay", is("display"))
        .body("content[0].relationship", is("TARGET_EQUIVALENT"))
        .body("content[0].flagged", is(false));

    restClient.givenDefaultUser()
        .queryParam("projection", "targetView")
        .queryParam("row.sourceCode.index", "10")
        .queryParam("row.map.id", mapId).log().all()
        .get("/mapRowTargets")
        .then().log().body().statusCode(200)
        .body("content", hasSize(1))
        .body("content[0]", not(hasKey("id")));

    restClient.deleteTask(taskId);
  }

  @Test
  public void shouldSetLastAuthorEditMapRow() throws Exception {
    long mapRowId = restClient.getMapRowId(mapId, "map row code 2.");

    restClient.checkLastModified(mapRowId, "lastAuthor", null);
    restClient.checkLastModified(mapRowId, "lastReviewer", null);

    long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "2");

    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, true, MapStatus.MAPPED);

    restClient.checkLastModified(mapRowId, "lastAuthor", DEFAULT_TEST_USER_SUBJECT);
    restClient.checkLastModified(mapRowId, "lastReviewer", null);

    long reviewTask = restClient.createTask(TaskType.REVIEW, mapId, MEMBER_TEST_USER, "2");

    restClient.updateStatus(MEMBER_TEST_USER, mapRowId, MapStatus.ACCEPTED);

    restClient.checkLastModified(mapRowId, "lastAuthor", DEFAULT_TEST_USER_SUBJECT);
    restClient.checkLastModified(mapRowId, "lastReviewer", MEMBER_TEST_USER);

    restClient.deleteTask(authorTask);
    restClient.deleteTask(reviewTask);
  }


  @Test
  public void failUpdateMapRowIllegalStateChange() throws Exception {
    long mapRowId = restClient.getMapRowId(mapId, "map row code 3.");

    long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "3");

    restClient.updateStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, MapStatus.MAPPED, 400,
        "Cannot change state from UNMAPPED for row with no mappings and 'no map' not set");

    restClient.checkStatus(mapRowId, MapStatus.UNMAPPED);

    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, true, MapStatus.DRAFT);

    restClient.checkStatus(mapRowId, MapStatus.DRAFT);

    restClient.updateStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, MapStatus.UNMAPPED, 400,
        "Cannot change state to UNMAPPED for row with mapping targets or 'no map' set");

    restClient.checkStatus(mapRowId, MapStatus.DRAFT);

    restClient.deleteTask(authorTask);
  }

  @Test
  public void failUpdateMapRowNotAuthor() throws Exception {
    long mapRowId = restClient.getMapRowId(mapId, "map row code 3.");

    long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, MEMBER_TEST_USER, "3");

    restClient.updateNoMapAndStatus(MEMBER_TEST_USER, mapRowId, true, MapStatus.DRAFT);

    restClient.updateStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(GUEST_TEST_USER, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(NO_ROLE_TEST_USER, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(MEMBER_TEST_USER, mapRowId, MapStatus.MAPPED);

    restClient.deleteTask(authorTask);
  }

  @Test
  public void failUpdateMapRowTargetNoTask() throws Exception {
      long mapRowId = restClient.getMapRowId(mapId, "map row code 4.");
      long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, MEMBER_TEST_USER, "4");
      long targetId = restClient.createTarget(MEMBER_TEST_USER, mapRowId, "foo", "bar", MappingRelationship.TARGET_NARROWER, false, 201);
      restClient.updateTarget(MEMBER_TEST_USER, targetId, "foo2", "bar2", MappingRelationship.TARGET_NARROWER, false, 200);
      restClient.deleteTask(authorTask);

      restClient.updateTarget(MEMBER_TEST_USER, targetId, "foo3", "bar3", MappingRelationship.TARGET_NARROWER, false, 403);
  }

  @Test
  public void shouldUpdateMapRowTargetFlagOwnerNoTask() throws Exception {
      long mapRowId = restClient.getMapRowId(mapId, "map row code 4.");
      long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, MEMBER_TEST_USER, "4");
      long targetId = restClient.createTarget(MEMBER_TEST_USER, mapRowId, "foo", "bar", MappingRelationship.TARGET_NARROWER, false, 201);
      restClient.deleteTask(authorTask);

      restClient.updateTargetFlag(DEFAULT_TEST_USER_SUBJECT, targetId, true, 200);
      restClient.updateTarget(MEMBER_TEST_USER, targetId, "foo2", "bar2", MappingRelationship.TARGET_NARROWER, false, 403);
  }

  @Test
  public void failUpdateMapRowTargetFlagNotOwnerNoTask() throws Exception {
      long mapRowId = restClient.getMapRowId(mapId, "map row code 4.");
      long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, MEMBER_TEST_USER, "4");
      long targetId = restClient.createTarget(MEMBER_TEST_USER, mapRowId, "foo", "bar", MappingRelationship.TARGET_NARROWER, false, 201);

      restClient.deleteTask(authorTask);

      restClient.updateTargetFlag(GUEST_TEST_USER, targetId, true, 403);
      restClient.updateTargetFlag(MEMBER_TEST_USER, targetId, true, 403);
      restClient.updateTargetFlag(NO_ROLE_TEST_USER, targetId, true, 403);

      restClient.updateTargetFlag(GUEST_TEST_USER, targetId, false, 403);
      restClient.updateTargetFlag(MEMBER_TEST_USER, targetId, false, 403);
      restClient.updateTargetFlag(NO_ROLE_TEST_USER, targetId, false, 403);
  }

  @Test
  public void failUpdateMapRowTargetNotAuthor() throws Exception {
    long mapRowId = restClient.getMapRowId(mapId, "map row code 4.");

    long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, MEMBER_TEST_USER, "4");

    restClient.updateNoMapAndStatus(MEMBER_TEST_USER, mapRowId, true, MapStatus.DRAFT);

    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapRowId, "foo", "bar", MappingRelationship.TARGET_NARROWER, false, 403);

    restClient.createTarget(GUEST_TEST_USER, mapRowId, "foo", "bar", MappingRelationship.TARGET_NARROWER, false, 403);

    restClient.createTarget(NO_ROLE_TEST_USER, mapRowId, "foo", "bar", MappingRelationship.TARGET_NARROWER, false, 403);

    restClient.createTarget(MEMBER_TEST_USER, mapRowId, "foo", "bar", MappingRelationship.TARGET_NARROWER, false, 201);

    restClient.deleteTask(authorTask);
  }


  @Test
  public void failUpdateMapRowNotReviewer() throws Exception {
    long mapRowId = restClient.getMapRowId(mapId, "map row code 5.");

    long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, MEMBER_TEST_USER, "5");
    long reviewTask = restClient.createTask(TaskType.REVIEW, mapId, GUEST_TEST_USER, "5");

    restClient.updateNoMapAndStatus(MEMBER_TEST_USER, mapRowId, true, MapStatus.DRAFT);

    restClient.updateStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(GUEST_TEST_USER, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(NO_ROLE_TEST_USER, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(MEMBER_TEST_USER, mapRowId, MapStatus.MAPPED);

    restClient.updateStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, MapStatus.INREVIEW, 403, null);
    restClient.updateStatus(NO_ROLE_TEST_USER, mapRowId, MapStatus.INREVIEW, 403, null);
    restClient.updateStatus(MEMBER_TEST_USER, mapRowId, MapStatus.INREVIEW, 403, null);
    restClient.updateStatus(GUEST_TEST_USER, mapRowId, MapStatus.INREVIEW);

    restClient.updateStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(NO_ROLE_TEST_USER, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(MEMBER_TEST_USER, mapRowId, MapStatus.MAPPED, 403, null);
    restClient.updateStatus(GUEST_TEST_USER, mapRowId, MapStatus.MAPPED, 403, null);

    restClient.updateStatus(GUEST_TEST_USER, mapRowId, MapStatus.REJECTED);

    restClient.updateStatus(DEFAULT_TEST_USER_SUBJECT, mapRowId, MapStatus.DRAFT, 403, null);
    restClient.updateStatus(NO_ROLE_TEST_USER, mapRowId, MapStatus.DRAFT, 403, null);
    restClient.updateStatus(GUEST_TEST_USER, mapRowId, MapStatus.DRAFT, 403, null);
    restClient.updateStatus(MEMBER_TEST_USER, mapRowId, MapStatus.DRAFT);

    restClient.updateStatus(MEMBER_TEST_USER, mapRowId, MapStatus.MAPPED);
    restClient.updateStatus(GUEST_TEST_USER, mapRowId, MapStatus.ACCEPTED);

    restClient.deleteTask(authorTask);
    restClient.deleteTask(reviewTask);
  }

  @Test
  public void shouldGetTargetRowsFilterByUnassigned() throws Exception {
    int expectedRowCountTotal = 34;

    long map2Id = restClient.createMap("Testing Map Version 2", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);

    long authorTask = restClient.createTask(TaskType.AUTHOR, map2Id, MEMBER_TEST_USER, "11-13");
    long reviewTask = restClient.createTask(TaskType.REVIEW, map2Id, GUEST_TEST_USER, "11-13");
    long authorTask2 = restClient.createTask(TaskType.AUTHOR, map2Id, GUEST_TEST_USER, "14-16");

    validateMapViewRowCountForFilter(map2Id, expectedRowCountTotal - 6, Pair.of("assignedAuthor", "none"));

    validateMapViewRowCountForFilter(map2Id, expectedRowCountTotal - 3, Pair.of("assignedReviewer", "none"));

    validateMapViewRowCountForFilter(map2Id, expectedRowCountTotal, Pair.of("lastAuthorReviewer", "none"));

    validateMapViewRowCountForFilter(map2Id, expectedRowCountTotal - 3, Pair.of("assignedAuthor", "none"),
        Pair.of("assignedAuthor", MEMBER_TEST_USER));

    validateMapViewRowCountForFilter(map2Id, 3, Pair.of("assignedAuthor", MEMBER_TEST_USER));

    validateMapViewRowCountForFilter(map2Id, expectedRowCountTotal, Pair.of("assignedReviewer", "none"),
        Pair.of("assignedReviewer", GUEST_TEST_USER));

    validateMapViewRowCountForFilter(map2Id, 3, Pair.of("assignedReviewer", GUEST_TEST_USER));

    validateMapViewRowCountForFilter(map2Id, expectedRowCountTotal, Pair.of("lastAuthorReviewer", "none"),
        Pair.of("lastAuthorReviewer", MEMBER_TEST_USER));

    restClient.deleteTask(authorTask);
    restClient.deleteTask(reviewTask);
    restClient.deleteTask(authorTask2);
  }

  @Test
  public void testSearchByMapId() throws Exception {
    long mapId = restClient.createMap("testSearchByMapId Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);

    long mapRowId = restClient.getMapRowId(mapId, "map row code 4.");
    long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, MEMBER_TEST_USER, "4");
    restClient.createTarget(MEMBER_TEST_USER, mapRowId, "foo", "bar2", MappingRelationship.TARGET_NARROWER, false, 201);
    restClient.deleteTask(authorTask);
    restClient.givenUser(MEMBER_TEST_USER).queryParam("mapId", mapId)
        .get("/mapRowTargets/search/findByMapId")
        .then().statusCode(200)
        .body("content", hasSize(1))
        .body("content[0].targetCode", is("foo"));
    restClient.givenUser(NO_ROLE_TEST_USER).queryParam("mapId", mapId)
        .get("/mapRowTargets/search/findByMapId")
        .then().statusCode(200).log().body()
        .body("content", hasSize(1))
        .body("content[0].value", hasSize(0));
  }

  private void validateMapViewRowCountForFilter(long mapId, int expectedRowCount, Pair<String, String>... param) {
    RequestSpecification requestSpecification = restClient.givenDefaultUser();
    for (int j = 0; j < param.length; j++) {
      requestSpecification.queryParam(param[j].getLeft(), param[j].getRight());
    }
    requestSpecification.log().all()
        .get("/mapView/" + mapId)
        .then().statusCode(200).log().body()
        .body("content", hasSize(lessThanOrEqualTo(expectedRowCount)))
        .body("page.totalElements", is(expectedRowCount));
  }
}
