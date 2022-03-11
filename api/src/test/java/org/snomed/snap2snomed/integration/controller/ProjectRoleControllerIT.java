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

import static org.hamcrest.Matchers.is;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.springframework.beans.factory.annotation.Autowired;

@TestInstance(Lifecycle.PER_CLASS)
public class ProjectRoleControllerIT extends IntegrationTestBase {

  @Autowired
  Snap2snomedConfiguration config;

  @Autowired
  ObjectMapper objectMapper;

  private static final String USER_1 = "user-1";
  private static final String USER_2 = "user-2";
  private long projectId;
  private long mapId;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(USER_1, "Test1", "Bobby", "User", "test1@user.com");
    restClient.createOrUpdateUser(USER_2, "Test2", "Bobby", "User", "test2@user.com");
    restClient.createOrUpdateAdminUser(DEFAULT_TEST_ADMIN_USER_SUBJECT, "A1", "Admin", "Admin", "admin@user.com");

    projectId = restClient.createProject("ProjectDemo", "Demo Project", Set.of(DEFAULT_TEST_USER_SUBJECT, USER_1), Set.of(), Set.of());

    long codesetId = restClient.createImportedCodeSet("test code set", "1.2.3", 34);

    mapId = restClient.createMap("Testing Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);
  }

  @BeforeEach
  private void beforeEachTest() throws JsonProcessingException {
    restClient.updateProjectRoles(DEFAULT_TEST_ADMIN_USER_SUBJECT, projectId, Set.of(DEFAULT_TEST_USER_SUBJECT, USER_1), Set.of(), Set.of());
  }

  @Test
  public void shouldUpdateProjectRoles() throws Exception {
    // rest client verifies the changes
    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, projectId, Set.of(USER_2), Set.of(USER_1), Set.of());

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, projectId, Set.of(USER_1), Set.of(USER_2), Set.of(), 403, null,
        null);

    restClient.updateProjectRoles(USER_2, projectId, Set.of(USER_1), Set.of(USER_2), Set.of());

    restClient.updateProjectRoles(USER_1, projectId, Set.of(USER_1), Set.of(), Set.of(USER_2));
  }

  @Test
  public void failNoOwner() throws Exception {
    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, projectId, Set.of(), Set.of(USER_2), Set.of(), 400,
            "Constraint Violation", null)
        .body("violations[0].message", is("Project must have at least one owner"));

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, projectId, Set.of(), Set.of(), Set.of(USER_2), 400,
            "Constraint Violation", null)
        .body("violations[0].message", is("Project must have at least one owner"));
  }


  @Test
  public void failMultipleRoles() throws Exception {
    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, projectId, Set.of(USER_2), Set.of(USER_2), Set.of(), 400,
        "A user can only hold one project role at a time", null);

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, projectId, Set.of(USER_2), Set.of(), Set.of(USER_2), 400,
        "A user can only hold one project role at a time", null);

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, projectId, Set.of(USER_2), Set.of(USER_2), Set.of(USER_2), 400,
        "A user can only hold one project role at a time", null);
  }

  @Test
  public void failAssignedTask() throws Exception {
    Long task = restClient.createTask(USER_1, TaskType.AUTHOR, mapId, USER_1, "1-4",
        false, false, "Description");

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, projectId, Set.of(USER_2), Set.of(), Set.of(), 400,
        "Users assigned to active tasks cannot be removed from project roles.", null);

    restClient.deleteTask(task);
  }

  /** Admin access to update project roles **/
  @Test
  public void shouldCreateProjectAsAdmin() throws Exception {
    RequestSpecification adminUser = restClient.givenUserWithGroup(DEFAULT_TEST_ADMIN_USER_SUBJECT,
            ContentType.JSON.getContentTypeStrings()[0],
            ContentType.JSON,
            config.getSecurity().getAdminGroup());
    Set<String> owners = Set.of(DEFAULT_TEST_USER_SUBJECT, USER_1);
    Set<String> emptyList = Set.of();
    String json = restClient.createProjectJson("ProjectByAdmin", "Admin Project", owners, emptyList, emptyList);
    long pid = adminUser.body(json)
            .post("/projects")
            .then()
            .statusCode(201)
            .extract().body().jsonPath().getLong("id");
    Assertions.assertNotNull(pid);

    long codesetId = restClient.createImportedCodeSet("admin test code set", "1.2.3", 20);

    mapId = restClient.createMap("1", "http://snomed.info/sct/32506021000036107/version/20210531",
            "http://map.test.toscope", pid, codesetId);
    Assertions.assertNotNull(mapId);
  }

  @Test
  public void shouldUpdateProjectRolesAsAdmin() throws Exception {
    RequestSpecification adminUser = restClient.givenUserWithGroup(DEFAULT_TEST_ADMIN_USER_SUBJECT,
            ContentType.JSON.getContentTypeStrings()[0],
            ContentType.JSON,
            config.getSecurity().getAdminGroup());
    Set<String> original_owners = Set.of(DEFAULT_TEST_USER_SUBJECT, USER_1);
    Map<String, Object> map = new HashMap<>();
    // Replace owners
    Set<String> owners = Set.of(USER_2);
    Set<String> emptyList = Set.of();
    map.put("owners", owners.stream().map(o -> User.builder().id(o).build()).collect(Collectors.toList()));
    map.put("members", emptyList.stream().map(o -> User.builder().id(o).build()).collect(Collectors.toList()));
    map.put("guests", emptyList.stream().map(o -> User.builder().id(o).build()).collect(Collectors.toList()));
    adminUser.body(objectMapper.writeValueAsString(map))
            .put("/project/" + projectId + "/roles")
            .then().statusCode(200);

    // Revert to original for other tests
    map.put("owners", original_owners.stream().map(o -> User.builder().id(o).build()).collect(Collectors.toList()));
    adminUser.body(objectMapper.writeValueAsString(map))
            .put("/project/" + projectId + "/roles")
            .then().statusCode(200);
  }
}
