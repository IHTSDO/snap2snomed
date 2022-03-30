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

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasEntry;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import java.io.IOException;
import java.time.Instant;
import java.util.Collections;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.springframework.beans.factory.annotation.Autowired;

@TestInstance(Lifecycle.PER_CLASS)
public class TaskResourceIT extends IntegrationTestBase {

  @Autowired
  Snap2snomedConfiguration config;

  private static final String NO_ROLE_TEST_USER = "no-role-user";
  private static final String MEMBER_TEST_USER = "member-user";
  private static final String GUEST_TEST_USER = "guest-user";
  private static final String OWNER_TEST_USER = "owner-user";

  private Long projectId;
  private Long codesetId;
  private Long mapId;

  private Long codeset2Id;
  private Long map2Id;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(OWNER_TEST_USER, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(NO_ROLE_TEST_USER, "Frank", "Bobby", "Smith", "frank.smith@user.com");
    restClient.createOrUpdateUser(MEMBER_TEST_USER, "Member", "Bobby", "User", "member@user.com");
    restClient.createOrUpdateUser(GUEST_TEST_USER, "Guest", "Bobby", "User", "guest@user.com");
    restClient.createOrUpdateUser("setup", "Setup", "Bobby", "User", "setup@user.com");
    restClient.createOrUpdateAdminUser(DEFAULT_TEST_ADMIN_USER_SUBJECT, "A1", "Admin", "Admin", "admin@user.com");

    projectId = restClient.createProject("Testing Project Title", "Testing Project Description",
        Set.of("setup"), Set.of(), Set.of());

    codesetId = restClient.createImportedCodeSet("test code set", "1.2.3", 34);

    mapId = restClient.createMap("Testing Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);

    Long setupAuthorTask = restClient.createTask("setup", TaskType.AUTHOR, mapId, "setup", "1-4",
        false, false, "Description");

    restClient.updateNoMapAndStatus("setup", mapId, "map row code " + 1 + ".", true, MapStatus.MAPPED);
    restClient.updateNoMapAndStatus("setup", mapId, "map row code " + 2 + ".", true, MapStatus.MAPPED);
    restClient.updateNoMapAndStatus("setup", mapId, "map row code " + 3 + ".", true, MapStatus.MAPPED);
    restClient.updateNoMapAndStatus("setup", mapId, "map row code " + 4 + ".", true, MapStatus.MAPPED);

    restClient.deleteTask(setupAuthorTask);

    Long setupReviewTask = restClient.createTask("setup", TaskType.REVIEW, mapId, "setup", "1-4",
        true, false, "Description");

    restClient.updateNoMapAndStatus("setup", mapId, "map row code " + 2 + ".", null, MapStatus.INREVIEW);
    restClient.updateNoMapAndStatus("setup", mapId, "map row code " + 3 + ".", null, MapStatus.ACCEPTED);
    restClient.updateNoMapAndStatus("setup", mapId, "map row code " + 4 + ".", null, MapStatus.REJECTED);

    restClient.deleteTask(setupReviewTask);

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT, OWNER_TEST_USER), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));

    codeset2Id = restClient.createImportedCodeSet("test code set 2", "1.2.3", 2037);

    map2Id = restClient.createMap("Testing Map Version 2", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codeset2Id);

  }

  @BeforeEach
  private void beforeEachTest() throws JsonProcessingException {
    restClient.deleteAllTasks();

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT, OWNER_TEST_USER), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));
  }

  @Test
  public void testCreate() throws IOException {
    Long taskId = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40",
        false, false, "Description");

    restClient.givenDefaultUser()
        .when().queryParam("projection", "embeddedTaskDetails")
        .get("/tasks/" + taskId)
        .then().log().body().statusCode(200)
        .body("sourceRowSpecification", is("1-3,15-34"))
        .body("type", is("AUTHOR"))
        .body("description", is("Description"))
        .body("map.id", isLongValue(mapId))
        .body("map.mapVersion", is("Testing Map Version"))
        .body("map.toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
        .body("map.toScope", is("http://map.test.toscope"))
        .body("assignee.id", is(DEFAULT_TEST_USER_SUBJECT))
        .body("assignee.givenName", is("Test"))
        .body("source.id", isLongValue(codesetId))
        .body("source.name", is("test code set"))
        .body("sourceRowCount", is("23"))
        .body("mapProject.id", isLongValue(projectId));

    restClient.deleteTask(taskId);
  }

  @Test
  public void failCreateEntityNoRole() throws IOException {
    restClient.expectCreateTaskFailure(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, NO_ROLE_TEST_USER, "1,2,3,15-24,20-40", false,
        false, null, 400,
        "User Frank Smith does not have a role for project Testing Project Title and cannot be assigned tasks");

    restClient.expectCreateTaskFailure(NO_ROLE_TEST_USER, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40", false,
        false, null, 403,
        "User Frank Smith is not authorised to assign a task to Test User in project Testing Project Title");

    restClient.expectCreateTaskFailure(NO_ROLE_TEST_USER, TaskType.REVIEW, mapId, NO_ROLE_TEST_USER, "1,2,3,15-24,20-40", false, false,
        null, 400,
        "User Frank Smith does not have a role for project Testing Project Title and cannot be assigned tasks");
  }

  @Test
  public void membersCanOnlySelfAssign() throws IOException {
    restClient.expectCreateTaskFailure(MEMBER_TEST_USER, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40", false,
        false, null, 403,
        "User Member User is not authorised to assign a task to Test User in project Testing Project Title",
        "A project member can only assign tasks to themselves.");

    Long taskId = restClient.createTask(MEMBER_TEST_USER, TaskType.AUTHOR, mapId, MEMBER_TEST_USER, "1,2,3,15-24,20-40", false, false,
        null);

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT), Collections.emptySet(), Collections.emptySet(), 400,
        "Users assigned to active tasks cannot be removed from project roles.",
        "The users Member User currently have active tasks but an attempt was made to remove them from the project.");

    restClient.deleteTask(taskId);

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT), Collections.emptySet(), Collections.emptySet());

    restClient.givenDefaultUser().get("/projects/" + projectId + "/members").then().statusCode(200)
        .body("content", everyItem(not(hasEntry("id", MEMBER_TEST_USER))));

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));

    restClient.givenDefaultUser().get("/projects/" + projectId + "/members").then().statusCode(200)
        .body("content", hasItem(hasEntry("id", MEMBER_TEST_USER)));

  }

  @Test
  public void failCreateEntityMembersCannotUserOverride() throws IOException {
    restClient.expectCreateTaskFailure(MEMBER_TEST_USER, TaskType.REVIEW, mapId, MEMBER_TEST_USER, "1,2,3,15-24,20-40", true, false, null,
        403,
        null, "A project member is not allowed to override task assignment and role conflict issues.");

    restClient.expectCreateTaskFailure(MEMBER_TEST_USER, TaskType.REVIEW, mapId, MEMBER_TEST_USER, "1,2,3,15-24,20-40", false, true, null,
        403,
        null, "A project member is not allowed to override task assignment and role conflict issues.");

    restClient.expectCreateTaskFailure(MEMBER_TEST_USER, TaskType.REVIEW, mapId, MEMBER_TEST_USER, "1,2,3,15-24,20-40", true, true, null,
        403,
        null, "A project member is not allowed to override task assignment and role conflict issues.");
  }


  @Test
  public void failCreateEntityGuestCannotCreate() throws IOException {
    restClient.expectCreateTaskFailure(GUEST_TEST_USER, TaskType.REVIEW, mapId, MEMBER_TEST_USER, "1,2,3,15-24,20-40", false, false, null,
        403,
        null, "A guest cannot create or assign tasks, even to themselves.");

    restClient.expectCreateTaskFailure(GUEST_TEST_USER, TaskType.REVIEW, mapId, MEMBER_TEST_USER, "1,2,3,15-24,20-40", true, false, null,
        403,
        null, "A guest cannot create or assign tasks, even to themselves.");

    restClient.expectCreateTaskFailure(GUEST_TEST_USER, TaskType.REVIEW, mapId, MEMBER_TEST_USER, "1,2,3,15-24,20-40", false, true, null,
        403,
        null, "A guest cannot create or assign tasks, even to themselves.");

    restClient.expectCreateTaskFailure(GUEST_TEST_USER, TaskType.REVIEW, mapId, MEMBER_TEST_USER, "1,2,3,15-24,20-40", true, true, null,
        403,
        null, "A guest cannot create or assign tasks, even to themselves.");
  }


  @Test
  public void failCreateEntityIntersection() throws IOException {
    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5,3,7,15,10-20", false, false, null);
    long reviewTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT, "2,3,15-24,20-40",
        true, false, null);
    restClient.givenDefaultUser()
        .body(restClient.createTaskJson(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40", false, false, null))
        .post("/tasks")
        .then()
        .statusCode(400)
        .body("type", is("http://snap2snomed.app/problem/task-specification-containse-unassignable-rows"))
        .body("indexCountWithRoleConflict", is(22))
        .body("indexCountWithExistingTaskConflict", is(9))
        .body("indexCountWithRoleAndExistingTaskConflict", is(8))
        .body("indexesWithExistingTask.specification", is("1-3,15-20"))
        .body("indexesWithExistingTask.count", is(9))
        .body("indexesWithRoleConflict.specification", is("2-3,15-34"))
        .body("indexesWithRoleConflict.count", is(22))
        .body("originalIndexSpecification.specification", is("1-3,15-34"))
        .body("originalIndexSpecification.count", is(23))
        .body("indexSpecificationWithRoleConflictsRemoved.specification", is("1"))
        .body("indexSpecificationWithRoleConflictsRemoved.count", is(1))
        .body("indexSpecificationWithExistingTaskConflictsRemoved.specification", is("21-34"))
        .body("indexSpecificationWithExistingTaskConflictsRemoved.count", is(14))
        .body("indexSpecificationWithAllConflictsRemoved.specification", is(nullValue()))
        .body("indexSpecificationWithAllConflictsRemoved.count", is(0));

    restClient.givenDefaultUser()
        .body(restClient.createTaskJson(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40", false, true, null))
        .post("/tasks")
        .then()
        .statusCode(400)
        .body("type", is("http://snap2snomed.app/problem/task-specification-containse-unassignable-rows"))
        .body("indexCountWithRoleConflict", is(22))
        .body("indexCountWithExistingTaskConflict", is(0))
        .body("indexCountWithRoleAndExistingTaskConflict", is(0))
        .body("indexesWithExistingTask.specification", is(nullValue()))
        .body("indexesWithExistingTask.count", is(0))
        .body("indexesWithRoleConflict.specification", is("2-3,15-34"))
        .body("indexesWithRoleConflict.count", is(22))
        .body("originalIndexSpecification.specification", is("1-3,15-34"))
        .body("originalIndexSpecification.count", is(23))
        .body("indexSpecificationWithRoleConflictsRemoved.specification", is("1"))
        .body("indexSpecificationWithRoleConflictsRemoved.count", is(1))
        .body("indexSpecificationWithExistingTaskConflictsRemoved.specification", is("1-3,15-34"))
        .body("indexSpecificationWithExistingTaskConflictsRemoved.count", is(23))
        .body("indexSpecificationWithAllConflictsRemoved.specification", is("1"))
        .body("indexSpecificationWithAllConflictsRemoved.count", is(1));

    restClient.givenDefaultUser()
        .body(restClient.createTaskJson(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40", true, false, null))
        .post("/tasks")
        .then()
        .statusCode(400)
        .body("type", is("http://snap2snomed.app/problem/task-specification-containse-unassignable-rows"))
        .body("indexCountWithRoleConflict", is(0))
        .body("indexCountWithExistingTaskConflict", is(9))
        .body("indexCountWithRoleAndExistingTaskConflict", is(0))
        .body("indexesWithExistingTask.specification", is("1-3,15-20"))
        .body("indexesWithExistingTask.count", is(9))
        .body("indexesWithRoleConflict.specification", is(nullValue()))
        .body("indexesWithRoleConflict.count", is(0))
        .body("originalIndexSpecification.specification", is("1-3,15-34"))
        .body("originalIndexSpecification.count", is(23))
        .body("indexSpecificationWithRoleConflictsRemoved.specification", is("1-3,15-34"))
        .body("indexSpecificationWithRoleConflictsRemoved.count", is(23))
        .body("indexSpecificationWithExistingTaskConflictsRemoved.specification", is("21-34"))
        .body("indexSpecificationWithExistingTaskConflictsRemoved.count", is(14))
        .body("indexSpecificationWithAllConflictsRemoved.specification", is("21-34"))
        .body("indexSpecificationWithAllConflictsRemoved.count", is(14));

    long taskWithOverride = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1,2,3,15-24,20-40", true, true, null);

    restClient.deleteTask(taskWithOverride);
    restClient.deleteTask(authorTask);
    restClient.deleteTask(reviewTask);
  }

  @Test
  public void shouldCreateEntityOverlappingRoles() throws Exception {
    testAuthorReviewTaskConflict(TaskType.REVIEW, TaskType.AUTHOR, true);
    testAuthorReviewTaskConflict(TaskType.AUTHOR, TaskType.REVIEW, true);
  }

  @Test
  public void failCreateEntityOverlappingRoles() throws Exception {
    // now it is OK to add a task overlapping the default task
    testAuthorReviewTaskConflict(TaskType.REVIEW, TaskType.AUTHOR, false);
    testAuthorReviewTaskConflict(TaskType.AUTHOR, TaskType.REVIEW, false);
  }

  private void testAuthorReviewTaskConflict(TaskType taskOneType, TaskType taskTwoType, boolean override) throws Exception {
    long task1 = restClient.createTask(taskOneType, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40");

    if (override) {
      long task2 = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, taskTwoType, mapId, DEFAULT_TEST_USER_SUBJECT, "1-3,15-34",
          true, false, null);

      restClient.deleteTask(task2);
    } else {
      restClient.givenDefaultUser()
          .body(restClient.createTaskJson(taskTwoType, mapId, DEFAULT_TEST_USER_SUBJECT, "1-3,15-34", false, false, null))
          .post("/tasks")
          .then()
          .statusCode(400)
          .body("type", is("http://snap2snomed.app/problem/task-specification-containse-unassignable-rows"))
          .body("indexCountWithRoleConflict", is(23))
          .body("indexCountWithExistingTaskConflict", is(0))
          .body("indexCountWithRoleAndExistingTaskConflict", is(0))
          .body("indexesWithExistingTask.specification", is(nullValue()))
          .body("indexesWithExistingTask.count", is(0))
          .body("indexesWithRoleConflict.specification", is("1-3,15-34"))
          .body("indexesWithRoleConflict.count", is(23))
          .body("originalIndexSpecification.specification", is("1-3,15-34"))
          .body("originalIndexSpecification.count", is(23))
          .body("indexSpecificationWithRoleConflictsRemoved.specification", is(nullValue()))
          .body("indexSpecificationWithRoleConflictsRemoved.count", is(0))
          .body("indexSpecificationWithExistingTaskConflictsRemoved.specification", is("1-3,15-34"))
          .body("indexSpecificationWithExistingTaskConflictsRemoved.count", is(23))
          .body("indexSpecificationWithAllConflictsRemoved.specification", is(nullValue()))
          .body("indexSpecificationWithAllConflictsRemoved.count", is(0));
    }

    restClient.deleteTask(task1);
  }

  @Test
  public void shouldCreateEntityOverlappingSourceRowSpecificationOverride() throws Exception {
    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5,3,7,15,10-20", false, false, null);

    long overlappingTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5,3,7,15,10-20", false, true, null);

    //new task took all the rows, so the old one is deleted
    restClient.givenDefaultUser().get("/tasks/" + authorTask).then().statusCode(403);
    restClient.deleteTask(overlappingTask);
  }

  @Test
  public void failCreateEntityOverlappingSourceRowSpecification() throws Exception {
    long authorTask = restClient.createTask(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1-5,3,7,15,10-20");

    // overlapping
    restClient.givenDefaultUser()
        .body(restClient.createTaskJson(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1-3,15-34", false, false, null))
        .post("/tasks")
        .then()
        .statusCode(400)
        .body("type", is("http://snap2snomed.app/problem/task-specification-containse-unassignable-rows"))
        .body("indexCountWithRoleConflict", is(0))
        .body("indexCountWithExistingTaskConflict", is(9))
        .body("indexCountWithRoleAndExistingTaskConflict", is(0))
        .body("indexesWithExistingTask.specification", is("1-3,15-20"))
        .body("indexesWithExistingTask.count", is(9))
        .body("indexesWithRoleConflict.specification", is(nullValue()))
        .body("indexesWithRoleConflict.count", is(0))
        .body("originalIndexSpecification.specification", is("1-3,15-34"))
        .body("originalIndexSpecification.count", is(23))
        .body("indexSpecificationWithRoleConflictsRemoved.specification", is("1-3,15-34"))
        .body("indexSpecificationWithRoleConflictsRemoved.count", is(23))
        .body("indexSpecificationWithExistingTaskConflictsRemoved.specification", is("21-34"))
        .body("indexSpecificationWithExistingTaskConflictsRemoved.count", is(14))
        .body("indexSpecificationWithAllConflictsRemoved.specification", is("21-34"))
        .body("indexSpecificationWithAllConflictsRemoved.count", is(14));

    // not overlapping
    long secondTask = restClient.createTask(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "6,8,9");

    restClient.deleteTask(authorTask);

    long overlappingOriginal = restClient.createTask(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40");

    restClient.deleteTask(secondTask);
    restClient.deleteTask(overlappingOriginal);

  }

  @Test
  public void shouldCreateEntityLongSourceRowSpec() throws Exception {
    long authorTask = restClient.createTask(TaskType.AUTHOR, map2Id, DEFAULT_TEST_USER_SUBJECT,
        "137,146,186,222,488-524,597-625,660-673,691-698,751-753,764-768,839-843,859,861-862,951-952,1165-1168,1170,1172-1174,1176-1220,1222-1223,1226-1236,1252,1254,1264-1267,1422-1423,1466-1494,1498,1726,1740,1788,1823-1828,1837-1839,1850-1853,1882,1901-1903,1920,1925-1927,1960-1962,1984,2007,2031-2034,2038");

    restClient.givenDefaultUser()
        .when().queryParam("projection", "embeddedTaskDetails")
        .get("/tasks/" + authorTask).then().statusCode(200)
        .body("sourceRowSpecification",
            is("137,146,186,222,488-524,597-625,660-673,691-698,751-753,764-768,839-843,859,861-862,951-952,1165-1168,1170,1172-1174,1176-1220,1222-1223,1226-1236,1252,1254,1264-1267,1422-1423,1466-1494,1498,1726,1740,1788,1823-1828,1837-1839,1850-1853,1882,1901-1903,1920,1925-1927,1960-1962,1984,2007,2031-2034"));

    restClient.deleteTask(authorTask);
  }

  @Test
  public void shouldUpdateTask() throws Exception {
    Instant now = Instant.now();

    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5,3,7,15,10-20", false, false, null);
    // changes to type and user are ignored

    validateCreatedAndModifiedAudit(now, null, "/tasks/" + authorTask, DEFAULT_TEST_USER_SUBJECT, DEFAULT_TEST_USER_SUBJECT);

    Instant later = Instant.now();

    restClient.updateTask(OWNER_TEST_USER, authorTask, TaskType.REVIEW, map2Id, GUEST_TEST_USER, "1-5,3,7", false,
        false, "new description");

    validateCreatedAndModifiedAudit(now, later, "/tasks/" + authorTask, DEFAULT_TEST_USER_SUBJECT, OWNER_TEST_USER);

    // changes to type and user are ignored
    restClient.givenDefaultUser()
        .when().queryParam("projection", "embeddedTaskDetails")
        .get("/tasks/" + authorTask)
        .then().log().all().statusCode(200)
        .body("sourceRowSpecification", is("1-5,7"))
        .body("type", is("AUTHOR"))
        .body("description", is("new description"))
        .body("map.id", isLongValue(mapId))
        .body("map.mapVersion", is("Testing Map Version"))
        .body("map.toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
        .body("map.toScope", is("http://map.test.toscope"))
        .body("assignee.id", is(DEFAULT_TEST_USER_SUBJECT))
        .body("assignee.givenName", is("Test"))
        .body("source.id", isLongValue(codesetId))
        .body("source.name", is("test code set"))
        .body("sourceRowCount", is("6"))
        .body("mapProject.id", isLongValue(projectId));

    validateNumberOfRevisions("/tasks/" + authorTask, 2);

    restClient.deleteTask(authorTask);

    validateNumberOfRevisions("/tasks/" + authorTask, 3);

    restClient.givenUser(DEFAULT_TEST_USER_SUBJECT, "text/uri-list", ContentType.JSON)
        .body("/maps/" + map2Id)
        .put("/tasks/" + authorTask + "/map")
        .then().statusCode(405);
  }

  @Test
  public void shouldCreateReviewTask() throws Exception {
    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5,3,7,15,10-20", false, false, null);

    long reviewTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, GUEST_TEST_USER,
        "1-5,3,7,15,10-20", false, false, null);

    restClient.deleteTask(authorTask);
    restClient.deleteTask(reviewTask);
  }

  @Test
  public void failDeleteTaskNotOwner() throws Exception {
    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5,3,7,15,10-20", false, false, null);

    restClient.expectDeleteTaskFailure(MEMBER_TEST_USER, authorTask, 403);

    restClient.deleteTask(authorTask);
  }

  @Test
  public void shouldCompleteAuthorTask() throws Exception {

    restClient.createOrUpdateUser("second-owner", "Another", "Bobby", "User", "another@user.com");

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT, "second-owner"), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));

    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-3", false, false, null);

    restClient.completeTask(MEMBER_TEST_USER, authorTask, 403);
    restClient.completeTask("second-owner", authorTask, 403);
    restClient.completeTask(DEFAULT_TEST_USER_SUBJECT, authorTask, 200);

    restClient.givenDefaultUser().get("/tasks/" + authorTask).then().statusCode(403);

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));
  }

  @Test
  public void shouldCompleteReviewTask() throws Exception {

    restClient.createOrUpdateUser("second-owner", "Another", "Bobby", "User", "another@user.com");

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT, "second-owner"), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));

    long reviewTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT,
        "3,4", false, false, null);

    restClient.completeTask(MEMBER_TEST_USER, reviewTask, 403);
    restClient.completeTask("second-owner", reviewTask, 403);
    restClient.completeTask(DEFAULT_TEST_USER_SUBJECT, reviewTask, 200);

    restClient.givenDefaultUser().get("/tasks/" + reviewTask).then().statusCode(403);

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId,
        Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));
  }

  @Test
  public void failCompleteTaskIncompleteRowsAuthor() throws Exception {
    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT,
        "5", false, false, null);

    restClient.completeTask(DEFAULT_TEST_USER_SUBJECT, authorTask, 400);

    restClient.deleteTask(authorTask);
  }

  @Test
  public void failCompleteTaskIncompleteRowsReviewer() throws Exception {
    long reviewTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT,
        "5", false, false, null);

    restClient.completeTask(DEFAULT_TEST_USER_SUBJECT, reviewTask, 400);

    restClient.deleteTask(reviewTask);
  }

  @Test
  public void shouldGetTasksForSpecifiedMapWhenUserIsAdmin() throws Exception {
    restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
            "1-3", false, false, null);
    restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, map2Id, DEFAULT_TEST_USER_SUBJECT,
            "1-3", false, false, null);

    RequestSpecification adminUser = restClient.givenUserWithGroup(DEFAULT_TEST_ADMIN_USER_SUBJECT,
            ContentType.JSON.getContentTypeStrings()[0],
            ContentType.JSON,
            config.getSecurity().getAdminGroup());

    adminUser.when().queryParam("projection", "embeddedTaskDetails")
            .queryParam("id", mapId)
            .get("/tasks/search/findByMapId")
            .then().statusCode(200)
            .body("content", hasSize(1));
  }

  @Test
  public void shouldGetTaskRowCount() throws Exception {
    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-4", false, false, null);

    restClient.givenDefaultUser()
        .get("/task/" + authorTask + "/$countIncompleteRows")
        .then().statusCode(200).log().body()
        .body("count", is(1))
        .body("specification", is("4"));

    restClient.deleteTask(authorTask);

    long reviewTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-4", false, false, null);

    restClient.givenDefaultUser()
        .get("/task/" + reviewTask + "/$countIncompleteRows")
        .then().statusCode(200)
        .body("count", is(2))
        .body("specification", is("1-2"));

    restClient.deleteTask(reviewTask);
  }

  @Test
  public void failGetTaskRowCountNotProjectMember() throws Exception {
    long authorTask = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-4", false, false, null);

    restClient.givenUser(NO_ROLE_TEST_USER)
        .get("/task/" + authorTask + "/$countIncompleteRows")
        .then().statusCode(403);

    restClient.deleteTask(authorTask);
  }

  @Test
  public void shouldGetAutoMapRows() throws Exception {
    long task = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5", false, false, null);

    restClient.givenDefaultUser()
        .get("/task/" + task + "/automapRows")
        .then().statusCode(200)
        .body(".", hasSize(1))
        .body("[0].display", is("map row display 5"));

    restClient.deleteTask(task);
  }

  @Test
  public void shouldNotGetAutoMapRowsReviewTask() throws Exception {
    long task = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5", false, false, null);

    restClient.givenDefaultUser()
        .get("/task/" + task + "/automapRows")
        .then().statusCode(200)
        .body(".", hasSize(0));

    restClient.deleteTask(task);
  }

  @Test
  public void shouldNotGetAutoMapRowsNoRows() throws Exception {
    long task = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-4", false, false, null);

    restClient.givenDefaultUser()
        .get("/task/" + task + "/automapRows")
        .then().statusCode(200)
        .body(".", hasSize(0));

    restClient.deleteTask(task);
  }

  @Test
  public void failGetAutoMapRowsNotAssignee() throws Exception {
    long task = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT,
        "1-5", false, false, null);

    restClient.givenUser(MEMBER_TEST_USER)
        .get("/task/" + task + "/automapRows")
        .then().statusCode(403);

    restClient.deleteTask(task);
  }

  @Test
  public void failAssignedTaskNoSuchAssignee() throws Exception {
    restClient.expectCreateTaskFailure(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, "no-such-user", "1-4",
        false, false, "Description", 400, "Assignee does not exist");
  }

  @Test
  public void shouldFailCreateTaskAsAdmin() throws Exception {
    restClient.givenUserWithGroup(DEFAULT_TEST_ADMIN_USER_SUBJECT,
                    ContentType.JSON.getContentTypeStrings()[0],
                    ContentType.JSON,
                    config.getSecurity().getAdminGroup())
            .body(restClient.createTaskJson(TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1,2,3,15-24,20-40", true, true, null))
            .post("/tasks")
            .then()
            .statusCode(403);
  }

  @Test
  public void shouldDeleteTaskAsAdmin() throws Exception {
    long task = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT,
            "5-10", false, false, null);
    RequestSpecification adminUser = restClient.givenUserWithGroup(DEFAULT_TEST_ADMIN_USER_SUBJECT,
            ContentType.JSON.getContentTypeStrings()[0],
            ContentType.JSON,
            config.getSecurity().getAdminGroup());
    adminUser.get("/tasks/" + task)
            .then().statusCode(200);
    adminUser.delete("/tasks/" + task).then().statusCode(204);

  }
}
