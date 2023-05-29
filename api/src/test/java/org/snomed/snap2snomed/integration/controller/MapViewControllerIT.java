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
import static org.assertj.core.api.Fail.fail;
import static org.hamcrest.Matchers.both;
import static org.hamcrest.Matchers.either;
import static org.hamcrest.Matchers.hasEntry;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.io.Files;
import io.restassured.http.ContentType;
import io.restassured.response.ValidatableResponse;
import io.restassured.specification.RequestSpecification;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Iterator;
import java.util.Set;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.controller.MapViewRestController;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;

@TestInstance(Lifecycle.PER_CLASS)
public class MapViewControllerIT extends IntegrationTestBase {

  @Autowired
  ObjectMapper objectMapper;

  @Autowired
  Snap2snomedConfiguration config;

  private long taskId, task2Id;

  private String user = "another-test-user";
  private String user2 = "yet-another-test-user";

  private long projectId, mapId;
  private long codesetId;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(user, "Bob", "Bobby", "Smith", "u2@csiro.au");
    restClient.createOrUpdateUser(user2, "Bob2", "Bobby", "Smith", "u3@csiro.au");
    restClient.createOrUpdateAdminUser(DEFAULT_TEST_ADMIN_USER_SUBJECT, "A1", "Admin", "Admin", "admin@user.com");

    projectId = restClient.createProject("ProjectDemo", "Demo Project", Set.of(DEFAULT_TEST_USER_SUBJECT, user, user2), Set.of(), Set.of());

    codesetId = restClient.createImportedCodeSet("test code set", "1.2.3", 34);

    mapId = restClient.createMap("Testing Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);

    taskId = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "*",
        false, false, "Test description");

    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 1.", "abc", "XYZ", MappingRelationship.TARGET_INEXACT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 1.", "def", "D E F", MappingRelationship.TARGET_INEXACT, false);
    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 1.", false, MapStatus.MAPPED);

    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 2.", true, MapStatus.DRAFT);
    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 3.", true, MapStatus.DRAFT);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 4.", "broader", "Broader", MappingRelationship.TARGET_BROADER,
        true);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 5.", "narrower", "Narrower",
        MappingRelationship.TARGET_NARROWER, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 6.", "equivalent", "Equivalent",
        MappingRelationship.TARGET_EQUIVALENT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 7.", "equivalent", "Equivalent",
        MappingRelationship.TARGET_INEXACT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 8.", "utf8", "ሰማይ አይታረስ ንጉሥ አይከሰስ።",
        MappingRelationship.TARGET_EQUIVALENT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 9.", "quotes",
        "This is a bit of text that has \"quotes\", as well as some commas to stir things up", MappingRelationship.TARGET_EQUIVALENT,
        false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 10.", "tabby",
        "This display has a tab \t to ensure this is handled", MappingRelationship.TARGET_EQUIVALENT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 11.", "inreview", "in review row",
        MappingRelationship.TARGET_EQUIVALENT, false);
    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 11.", false, MapStatus.MAPPED);

    restClient.deleteTask(taskId);

    taskId = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT, "*",
        true, false, "Test description");

    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 11.", false, MapStatus.INREVIEW);

    restClient.deleteTask(taskId);

    taskId = restClient.createTask(user, TaskType.AUTHOR, mapId, user, "1-5,3,7,15,10-20",
        true, false, "Test description");

    task2Id = restClient.createTask(user2, TaskType.REVIEW, mapId, user2, "1-5,3,7,15,10-20",
        true, false, "Test description");

  }

  @Test
  public void shouldGetViewNoTargets() throws Exception {
    getMapView(35, 200, "sourceIndex")
        .body("content[20].sourceIndex", is(20))
        .body("content[20].sourceCode", is("map row code 20."))
        .body("content[20].sourceDisplay", is("map row display 20"))
        .body("content[20].noMap", is(false))
        .body("content[20].targetId", is(nullValue()))
        .body("content[20].targetCode", is(nullValue()))
        .body("content[20].targetDisplay", is(nullValue()))
        .body("content[20].relationship", is(nullValue()))
        .body("content[20].status", is(MapStatus.UNMAPPED.name()))
        .body("content[20].assignedAuthor[0].id", is(user))
        .body("content[20].assignedReviewer.id", is(user2));
  }

  private ValidatableResponse getMapView(int size, int expectedStatusCode, String sortColumn, Pair<String, Object>... qs) {
    RequestSpecification request = restClient.givenUser(user)
        .queryParam("size", 100)
        .queryParam("sort", sortColumn);

    for (Pair<String, Object> item : qs) {
      request.queryParam(item.getLeft(), item.getRight());
    }

    return request.get("/mapView/" + mapId)
        .then().statusCode(expectedStatusCode)
        .body("content", hasSize(size));
  }

  private ValidatableResponse getTaskView(long taskId, int size, int expectedStatusCode, String sortColumn, Pair<String, Object>... qs) {
    RequestSpecification request = restClient.givenUser(user)
        .queryParam("size", 100)
        .queryParam("sort", sortColumn);

    for (Pair<String, Object> item : qs) {
      request.queryParam(item.getLeft(), item.getRight());
    }

    return request.get("/mapView/task/" + taskId)
        .then().statusCode(expectedStatusCode)
        .body("content", hasSize(size));
  }

  @Test
  public void shouldGetViewOneTarget() throws Exception {
    getMapView(35, 200, "sourceIndex")
        .body("content[4].sourceIndex", is(4))
        .body("content[4].sourceCode", is("map row code 4."))
        .body("content[4].sourceDisplay", is("map row display 4"))
        .body("content[4].noMap", is(false))
        .body("content[4].targetCode", is("broader"))
        .body("content[4].targetDisplay", is("Broader"))
        .body("content[4].relationship", is(MappingRelationship.TARGET_BROADER.name()))
        .body("content[4].status", is(MapStatus.DRAFT.name()));
  }


  @Test
  public void shouldGetViewMultipleTargets() throws Exception {
    getMapView(35, 200, "sourceIndex", Pair.of("sort", "targetCode,asc"))
        .body("content", hasItem(both(hasEntry("targetCode", "abc")).and(hasEntry("targetDisplay", "XYZ"))))
        .body("content", hasItem(both(hasEntry("targetCode", "def")).and(hasEntry("targetDisplay", "D E F"))));
  }

  // test filter code
  @Test
  public void shouldGetViewCodeFilter() throws Exception {
    getMapView(12, 200, "sourceIndex", Pair.of("sourceCode", "map row code 1"))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].sourceCode", is("map row code 1."))
        .body("content[0].sourceDisplay", is("map row display 1"));

    getMapView(35, 200, "sourceIndex", Pair.of("sourceCode", "map row code"))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].sourceCode", is("map row code 1."))
        .body("content[0].sourceDisplay", is("map row display 1"));

    getMapView(2, 200, "sourceIndex", Pair.of("sourceCode", "map row code 10"), Pair.of("sourceCode", "map row code 34"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"))
        .body("content[1].sourceIndex", is(34))
        .body("content[1].sourceCode", is("map row code 34."))
        .body("content[1].sourceDisplay", is("map row display 34"));

    getMapView(0, 200, "sourceIndex", Pair.of("sourceCode", "no match"));
  }

  @Test
  public void shouldGetViewDisplayFilter() throws Exception {
    getMapView(1, 200, "sourceIndex", Pair.of("sourceDisplay", "map row display 34"))
        .body("content[0].sourceIndex", is(34))
        .body("content[0].sourceCode", is("map row code 34."))
        .body("content[0].sourceDisplay", is("map row display 34"))
        .body("content[0].noMap", is(false))
        .body("content[0].targetId", is(nullValue()))
        .body("content[0].targetCode", is(nullValue()))
        .body("content[0].targetDisplay", is(nullValue()))
        .body("content[0].relationship", is(nullValue()))
        .body("content[0].status", is(MapStatus.UNMAPPED.name()));

    getMapView(35, 200, "sourceIndex", Pair.of("sourceDisplay", "DISPLAY"))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].sourceCode", is("map row code 1."))
        .body("content[0].sourceDisplay", is("map row display 1"));

    getMapView(1, 200, "sourceIndex", Pair.of("sourceDisplay", "map row"), Pair.of("sourceDisplay", "10"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"));
  }

  @Test
  public void shouldGetViewTargetCodeFilter() throws Exception {
    getMapView(1, 200, "sourceIndex", Pair.of("targetCode", "tabby"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"))
        .body("content[0].targetCode", is("tabby"));

    getMapView(2, 200, "sourceIndex", Pair.of("targetCode", "tabby"), Pair.of("targetCode", "abc"))
        .body("content[0].sourceCode", is("map row code 1."))
        .body("content[0].sourceDisplay", is("map row display 1"))
        .body("content[0].targetCode", is("abc"))
        .body("content[1].sourceIndex", is(10))
        .body("content[1].sourceCode", is("map row code 10."))
        .body("content[1].sourceDisplay", is("map row display 10"))
        .body("content[1].targetCode", is("tabby"));
  }

  @Test
  public void shouldGetViewTargetDisplayFilter() throws Exception {
    getMapView(1, 200, "sourceIndex", Pair.of("targetDisplay", "tab"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"))
        .body("content[0].targetCode", is("tabby"));

    getMapView(1, 200, "sourceIndex", Pair.of("targetDisplay", "This display"), Pair.of("targetDisplay", "has a tab"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"))
        .body("content[0].targetCode", is("tabby"));
  }


  @Test
  public void shouldGetViewNoMapFilter() throws Exception {
    getMapView(2, 200, "sourceIndex", Pair.of("noMap", true))
        .body("content[0].sourceIndex", is(2))
        .body("content[1].sourceIndex", is(3));

    getMapView(33, 200, "sourceIndex", Pair.of("noMap", false));
  }


  @Test
  public void shouldGetViewRelationshipFilter() throws Exception {
    getMapView(1, 200, "sourceIndex", Pair.of("relationship", MappingRelationship.TARGET_BROADER))
        .body("content[0].sourceIndex", is(4));

    getMapView(6, 200, "sourceIndex", Pair.of("relationship", MappingRelationship.TARGET_BROADER),
        Pair.of("relationship", MappingRelationship.TARGET_EQUIVALENT))
        .body("content[0].sourceIndex", is(4))
        .body("content[1].sourceIndex", is(6))
        .body("content[2].sourceIndex", is(8))
        .body("content[3].sourceIndex", is(9))
        .body("content[4].sourceIndex", is(10))
        .body("content[5].sourceIndex", is(11));
  }


  @Test
  public void shouldGetViewStatusFilter() throws Exception {
    getMapView(2, 200, "sourceIndex", Pair.of("status", MapStatus.MAPPED.name()))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].targetCode", either(is("def")).or(is("abc")))
        .body("content[1].sourceIndex", is(1))
        .body("content[1].targetCode", either(is("def")).or(is("abc")));

    getMapView(25, 200, "sourceIndex", Pair.of("status", MapStatus.MAPPED.name()),
        Pair.of("status", MapStatus.UNMAPPED.name()));
  }


  @Test
  public void shouldGetViewFilterCombinationWithNone() throws Exception {
    final int noAssignees = 17;
    final int userAssignees = 18;
    final int user2Assignees = 0;

    getMapView(noAssignees, 200, "sourceIndex", Pair.of("assignedAuthor", "none"));
    getMapView(userAssignees, 200, "sourceIndex", Pair.of("assignedAuthor", user));
    getMapView(user2Assignees, 200, "sourceIndex", Pair.of("assignedAuthor", user2));

    getMapView(noAssignees + userAssignees, 200, "sourceIndex", Pair.of("assignedAuthor", "none"), Pair.of("assignedAuthor", user));
    getMapView(noAssignees + user2Assignees, 200, "sourceIndex", Pair.of("assignedAuthor", "none"), Pair.of("assignedAuthor", user2));
  }


  @Test
  public void shouldGetViewFilterCombination() throws Exception {
    getMapView(1, 200, "sourceIndex", Pair.of("status", MapStatus.DRAFT.name()),
        Pair.of("relationship", MappingRelationship.TARGET_EQUIVALENT.name()),
        Pair.of("sourceDisplay", "display"), Pair.of("targetDisplay", "quote"))
        .body("content[0].sourceIndex", is(9))
        .body("content[0].targetCode", is("quotes"));
  }

  @Test
  public void shouldGetViewFilteredByTask() throws Exception {
    getTaskView(taskId, 18, 200, "sourceIndex")
        .body("content", hasItem(hasEntry("sourceIndex", 1)))
        .body("content", hasItem(hasEntry("sourceIndex", 2)))
        .body("content", hasItem(hasEntry("sourceIndex", 3)))
        .body("content", hasItem(hasEntry("sourceIndex", 4)))
        .body("content", hasItem(hasEntry("sourceIndex", 5)))
        .body("content", hasItem(hasEntry("sourceIndex", 7)))
        .body("content", hasItem(hasEntry("sourceIndex", 10)))
        .body("content", hasItem(hasEntry("sourceIndex", 11)))
        .body("content", hasItem(hasEntry("sourceIndex", 12)))
        .body("content", hasItem(hasEntry("sourceIndex", 13)))
        .body("content", hasItem(hasEntry("sourceIndex", 14)))
        .body("content", hasItem(hasEntry("sourceIndex", 15)))
        .body("content", hasItem(hasEntry("sourceIndex", 16)))
        .body("content", hasItem(hasEntry("sourceIndex", 17)))
        .body("content", hasItem(hasEntry("sourceIndex", 18)))
        .body("content", hasItem(hasEntry("sourceIndex", 19)))
        .body("content", hasItem(hasEntry("sourceIndex", 20)));

    restClient.updateTask(DEFAULT_TEST_USER_SUBJECT, taskId, TaskType.AUTHOR, mapId, user, "*", false, false, "foo");

    getTaskView(taskId, 35, 200, "sourceIndex");

    restClient.updateTask(user, taskId, TaskType.AUTHOR, mapId, user, "1-5,3,7,15,10-20", true, false, "Test description");
  }

  // test filter code

  @Test
  public void shouldGetTaskViewCodeFilter() throws Exception {
    getTaskView(taskId, 12, 200, "sourceIndex", Pair.of("sourceCode", "map row code 1"))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].sourceCode", is("map row code 1."))
        .body("content[0].sourceDisplay", is("map row display 1"));

    getTaskView(taskId, 18, 200, "sourceIndex", Pair.of("sourceCode", "map row code"))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].sourceCode", is("map row code 1."))
        .body("content[0].sourceDisplay", is("map row display 1"));

    getTaskView(taskId, 2, 200, "sourceIndex", Pair.of("sourceCode", "map row code 10"), Pair.of("sourceCode", "map row code 20"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"))
        .body("content[1].sourceIndex", is(20))
        .body("content[1].sourceCode", is("map row code 20."))
        .body("content[1].sourceDisplay", is("map row display 20"));

    getTaskView(taskId, 0, 200, "sourceIndex", Pair.of("sourceCode", "no match"));
  }


  @Test
  public void shouldGetTaskViewDisplayFilter() throws Exception {
    getTaskView(taskId, 1, 200, "sourceIndex", Pair.of("sourceDisplay", "map row display 10"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"));

    getTaskView(taskId, 18, 200, "sourceIndex", Pair.of("sourceDisplay", "DISPLAY"))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].sourceCode", is("map row code 1."))
        .body("content[0].sourceDisplay", is("map row display 1"));

    getTaskView(taskId, 1, 200, "sourceIndex", Pair.of("sourceDisplay", "map row"), Pair.of("sourceDisplay", "10"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"));
  }


  @Test
  public void shouldGetTaskViewTargetCodeFilter() throws Exception {
    getTaskView(taskId, 1, 200, "sourceIndex", Pair.of("targetCode", "tabby"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"))
        .body("content[0].targetCode", is("tabby"));

    getTaskView(taskId, 2, 200, "sourceIndex", Pair.of("targetCode", "tabby"), Pair.of("targetCode", "abc"))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].sourceCode", is("map row code 1."))
        .body("content[0].sourceDisplay", is("map row display 1"))
        .body("content[0].targetCode", is("abc"))
        .body("content[1].sourceIndex", is(10))
        .body("content[1].sourceCode", is("map row code 10."))
        .body("content[1].sourceDisplay", is("map row display 10"))
        .body("content[1].targetCode", is("tabby"));
  }


  @Test
  public void shouldGetTaskViewTargetDisplayFilter() throws Exception {
    getTaskView(taskId, 1, 200, "sourceIndex", Pair.of("targetDisplay", "tab"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"))
        .body("content[0].targetCode", is("tabby"));

    getTaskView(taskId, 1, 200, "sourceIndex", Pair.of("targetDisplay", "This display"), Pair.of("targetDisplay", "has a tab"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].sourceCode", is("map row code 10."))
        .body("content[0].sourceDisplay", is("map row display 10"))
        .body("content[0].targetCode", is("tabby"));
  }


  @Test
  public void shouldGetTaskViewNoMapFilter() throws Exception {
    getTaskView(taskId, 2, 200, "sourceIndex", Pair.of("noMap", true))
        .body("content[0].sourceIndex", is(2))
        .body("content[1].sourceIndex", is(3));

    getTaskView(taskId, 16, 200, "sourceIndex", Pair.of("noMap", false));
  }


  @Test
  public void shouldGetTaskViewRelationshipFilter() throws Exception {
    getTaskView(taskId, 1, 200, "sourceIndex", Pair.of("relationship", MappingRelationship.TARGET_BROADER.name()))
        .body("content[0].sourceIndex", is(4));

    getTaskView(taskId, 3, 200, "sourceIndex", Pair.of("relationship", MappingRelationship.TARGET_BROADER.name()),
        Pair.of("relationship", MappingRelationship.TARGET_EQUIVALENT.name()))
        .body("content[0].sourceIndex", is(4))
        .body("content[1].sourceIndex", is(10))
        .body("content[2].sourceIndex", is(11));
  }

  @Test
  public void shouldGetTaskViewStatusFilter() throws Exception {
    getTaskView(taskId, 2, 200, "sourceIndex", Pair.of("status", MapStatus.MAPPED.name()))
        .body("content[0].sourceIndex", is(1))
        .body("content[0].targetCode", either(is("def")).or(is("abc")))
        .body("content[1].sourceIndex", is(1))
        .body("content[1].targetCode", either(is("def")).or(is("abc")));

    getTaskView(taskId, 11, 200, "sourceIndex", Pair.of("status", MapStatus.MAPPED.name()),
        Pair.of("status", MapStatus.UNMAPPED.name()));
  }

  @Test
  public void shouldGetTaskViewFilterCombination() throws Exception {
    getTaskView(taskId, 1, 200, "sourceIndex", Pair.of("status", MapStatus.DRAFT.name()),
        Pair.of("relationship", MappingRelationship.TARGET_EQUIVALENT.name()), Pair.of("sourceDisplay", "display"),
        Pair.of("targetDisplay", "tab"))
        .body("content[0].sourceIndex", is(10))
        .body("content[0].targetCode", is("tabby"));
  }


  @Test
  public void shouldGetViewFlagged() throws Exception {
    getMapView(35, 200, "sourceIndex")
        .body("content[0].sourceIndex", is(1))
        .body("content[0].flagged", is(false))
        .body("content[1].sourceIndex", is(1))
        .body("content[1].flagged", is(false))
        .body("content[2].sourceIndex", is(2))
        .body("content[2].flagged", is(false))
        .body("content[3].sourceIndex", is(3))
        .body("content[3].flagged", is(false))
        .body("content[4].sourceIndex", is(4))
        .body("content[4].flagged", is(true))
        .body("content[5].sourceIndex", is(5))
        .body("content[5].flagged", is(false));
  }


  @Test
  public void shouldGetViewFilterByFlagged() throws Exception {
    getMapView(1, 200, "sourceIndex", Pair.of("flagged", true))
        .body("content[0].sourceIndex", is(4));

    getMapView(9, 200, "sourceIndex", Pair.of("flagged", false))
        .body("content", not(hasItem(hasEntry("sourceIndex", 4))));
  }


  @Test
  public void shouldGetViewSortByFlagged() throws Exception {
    getMapView(35, 200, "flagged")
        .body("content[34].sourceIndex", is(4));

    getMapView(35, 200, "flagged,asc")
        .body("content[34].sourceIndex", is(4));

    getMapView(35, 200, "flagged,desc")
        .body("content[0].sourceIndex", is(4));
  }


  @Test
  public void shouldGetTaskViewFlagged() throws Exception {
    getTaskView(taskId, 18, 200, "sourceIndex")
        .body("content[0].sourceIndex", is(1))
        .body("content[0].flagged", is(false))
        .body("content[1].sourceIndex", is(1))
        .body("content[1].flagged", is(false))
        .body("content[2].sourceIndex", is(2))
        .body("content[2].flagged", is(false))
        .body("content[3].sourceIndex", is(3))
        .body("content[3].flagged", is(false))
        .body("content[4].sourceIndex", is(4))
        .body("content[4].flagged", is(true))
        .body("content[5].sourceIndex", is(5))
        .body("content[5].flagged", is(false));
  }


  @Test
  public void shouldGetTaskViewFilterByFlagged() throws Exception {
    getTaskView(taskId, 1, 200, "sourceIndex", Pair.of("flagged", true))
        .body("content[0].sourceIndex", is(4));

    getTaskView(taskId, 6, 200, "sourceIndex", Pair.of("flagged", false))
        .body("content", not(hasItem(hasEntry("sourceIndex", 4))));
  }


  @Test
  public void shouldGetTaskViewSortByFlagged() throws Exception {
    getTaskView(taskId, 18, 200, "flagged")
        .body("content[17].sourceIndex", is(4));

    getTaskView(taskId, 18, 200, "flagged,asc")
        .body("content[17].sourceIndex", is(4));

    getTaskView(taskId, 18, 200, "flagged,desc")
        .body("content[0].sourceIndex", is(4));
  }


  @Test
  public void badRequestUnknownMapId() throws Exception {
    restClient.givenUser(user).get("/mapView/999?size=100&sort=sourceIndex")
        .then().statusCode(403);
  }


  @Test
  public void badRequestUnknownTaskId() throws Exception {
    restClient.givenUser(user).get("/mapView/task/999?size=100&sort=sourceIndex")
        .then().statusCode(403);
  }


  @Test
  public void badExportRequestUnknownMediaType() throws Exception {
    restClient.givenUser(user, "application/json", ContentType.XML)
        .get("/mapView/" + mapId)
        .then().statusCode(406);
  }


  @Test
  public void badExportRequestUnknownMapId() throws Exception {
    restClient.givenUser(user, "application/json", MapViewRestController.TEXT_CSV)
        .get("/mapView/999")
        .then().statusCode(403);
    restClient.givenUser(user, "application/json", MapViewRestController.TEXT_TSV)
        .get("/mapView/999")
        .then().statusCode(403);
    restClient.givenUser(user, "application/json", MapViewRestController.APPLICATION_XSLX)
        .get("/mapView/999")
        .then().statusCode(403);
  }


  @Test
  public void testExportCsv() throws Exception {
    byte[] result = exportMapViewFile(MapViewRestController.TEXT_CSV);
    assertCsvContent(result);
  }

  private byte[] exportMapViewFile(String accept, Pair<String, Object>... qs) {
    RequestSpecification request = restClient.givenUser(user, "application/json", accept);

    for (Pair<String, Object> item : qs) {
      request.queryParam(item.getLeft(), item.getRight());
    }
    return request.get("/mapView/" + mapId)
        .then().statusCode(200)
        .contentType(accept)
        .extract().body().asByteArray();
  }


  @Test
  public void testExportTsv() throws Exception {
    byte[] result = exportMapViewFile(MapViewRestController.TEXT_TSV);
    assertTsvContent(result);
  }


  @Test
  public void testExportXlsx() throws Exception {
    byte[] result = exportMapViewFile(MapViewRestController.APPLICATION_XSLX);
    assertXlsxContent(result);
  }


  @Test
  public void testExportIgnoresSortAndSizeParametersCsv() throws Exception {
    // Assert that adding size/sort parameters doesn't affect export
    byte[] result = exportMapViewFile(MapViewRestController.TEXT_CSV, Pair.of("size", 5), Pair.of("sort", "sourceDisplay"));

    assertCsvContent(result);
  }


  @Test
  public void testExportIgnoresSortAndSizeParametersTsv() throws Exception {
    // Assert that adding size/sort parameters doesn't affect export
    byte[] result = exportMapViewFile(MapViewRestController.TEXT_TSV, Pair.of("size", 5), Pair.of("sort", "sourceDisplay"));
    assertTsvContent(result);
  }


  @Test
  public void testExportIgnoresSortAndSizeParametersXlsx() throws Exception {
    // Assert that adding size/sort parameters doesn't affect export
    byte[] result = exportMapViewFile(MapViewRestController.APPLICATION_XSLX, Pair.of("size", 5), Pair.of("sort", "sourceDisplay"));
    assertXlsxContent(result);
  }

  private void assertTsvContent(byte[] result) throws IOException {
    assertThat(result)
        .isEqualTo(Files.toByteArray(new ClassPathResource("test_export.tsv").getFile()));
  }


  private void assertCsvContent(byte[] result) throws IOException {
    assertThat(result).isEqualTo(Files.toByteArray(new ClassPathResource("test_export.csv").getFile()));
  }

  private void assertXlsxContent(byte[] result) throws IOException, FileNotFoundException {
    try (ByteArrayInputStream export = new ByteArrayInputStream(result);
        Workbook exportedWorkbook = new XSSFWorkbook(export);) {
      Iterator<Row> exportedIterator = exportedWorkbook.getSheetAt(0).iterator();

      try (FileInputStream expected = new FileInputStream(new ClassPathResource("test_export.xlsx").getFile());
          Workbook expectedWorkbook = new XSSFWorkbook(expected);) {
        Iterator<Row> expectedIterator = expectedWorkbook.getSheetAt(0).iterator();

        while (exportedIterator.hasNext()) {
          Row exportedRow = exportedIterator.next();
          Row expectedRow = expectedIterator.next();

          Iterator<Cell> exportedCellIterator = exportedRow.iterator();
          Iterator<Cell> expectedCellIterator = expectedRow.iterator();

          while (exportedCellIterator.hasNext()) {
            Cell exportedCell = exportedCellIterator.next();
            Cell expectedCell = expectedCellIterator.next();

            switch (exportedCell.getCellType()) {
              case NUMERIC:
                assertThat(exportedCell.getNumericCellValue()).isEqualTo(expectedCell.getNumericCellValue());
                break;
              case BOOLEAN:
                assertThat(exportedCell.getBooleanCellValue()).isEqualTo(expectedCell.getBooleanCellValue());
                break;
              case STRING:
                assertThat(exportedCell.getStringCellValue()).isEqualTo(expectedCell.getStringCellValue());
                break;
              case BLANK:
                assertThat(expectedCell.getCellType()).isEqualTo(CellType.BLANK);
                break;
              default:
                fail("Unexpected cell type " + exportedCell.getCellType() + " for cell " + exportedCell.getAddress().formatAsString());
            }

          }

          assertThat(expectedCellIterator.hasNext()).isFalse();
        }

        assertThat(expectedIterator.hasNext()).isFalse();
      }

    }
  }

  /** Admin access tests where admin user is not owner **/
  private ValidatableResponse getMapViewAsAdmin(int size, int expectedStatusCode, String sortColumn, Pair<String, Object>... qs) {
    RequestSpecification request = restClient.givenUserWithGroup(DEFAULT_TEST_ADMIN_USER_SUBJECT,
                    ContentType.JSON.getContentTypeStrings()[0],
                    ContentType.JSON,
                    config.getSecurity().getAdminGroup())
            .queryParam("size", 100)
            .queryParam("sort", sortColumn);

    for (Pair<String, Object> item : qs) {
      request.queryParam(item.getLeft(), item.getRight());
    }

    return request.get("/mapView/" + mapId)
            .then().statusCode(expectedStatusCode)
            .body("content", hasSize(size));
  }

  private ValidatableResponse getTaskViewAsAdmin(long taskId, int size, int expectedStatusCode, String sortColumn, Pair<String, Object>... qs) {
    RequestSpecification request = restClient.givenUserWithGroup(DEFAULT_TEST_ADMIN_USER_SUBJECT,
                    ContentType.JSON.getContentTypeStrings()[0],
                    ContentType.JSON,
                    config.getSecurity().getAdminGroup())
            .queryParam("size", 100)
            .queryParam("sort", sortColumn);

    for (Pair<String, Object> item : qs) {
      request.queryParam(item.getLeft(), item.getRight());
    }

    return request.get("/mapView/task/" + taskId)
            .then().statusCode(expectedStatusCode)
            .body("content", hasSize(size));
  }


  @Test
  public void shouldGetViewAsAdmin() throws Exception {
    getMapViewAsAdmin(35, 200, "sourceIndex")
            .body("content[20].sourceIndex", is(20))
            .body("content[20].sourceCode", is("map row code 20."))
            .body("content[20].sourceDisplay", is("map row display 20"))
            .body("content[20].noMap", is(false))
            .body("content[20].targetId", is(nullValue()))
            .body("content[20].targetCode", is(nullValue()))
            .body("content[20].targetDisplay", is(nullValue()))
            .body("content[20].relationship", is(nullValue()))
            .body("content[20].status", is(MapStatus.UNMAPPED.name()))
            .body("content[20].assignedAuthor[0].id", is(user))
            .body("content[20].assignedReviewer.id", is(user2));
  }

  @Test
  public void shouldGetTaskViewAsAdmin() throws Exception {
    getTaskViewAsAdmin(taskId, 12, 200, "sourceIndex", Pair.of("sourceCode", "map row code 1"))
            .body("content[0].sourceIndex", is(1))
            .body("content[0].sourceCode", is("map row code 1."))
            .body("content[0].sourceDisplay", is("map row display 1"));
  }

}
