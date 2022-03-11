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

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasEntry;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;

import io.restassured.filter.log.LogDetail;
import io.restassured.http.ContentType;
import java.io.IOException;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.springframework.beans.factory.annotation.Autowired;

@TestInstance(Lifecycle.PER_CLASS)
public class ProjectResourceIT extends IntegrationTestBase {

  @Autowired
  Snap2snomedConfiguration config;

  private static final String EXTRA_USER = "extra-user";
  private static final String ANOTHER_EXTRA_USER = "another-extra-user";

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(EXTRA_USER, "Frank", "Bobby", "Smith", "frank.smith@user.com");
    restClient.createOrUpdateUser(ANOTHER_EXTRA_USER, "Another", "Bobby", "Smith", "another.smith@user.com");
  }

  @Test
  public void shouldCreateEntity() throws Exception {
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(), Set.of());

    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("owners", hasItem(hasEntry("id", DEFAULT_TEST_USER_SUBJECT)))
        .body("members", hasSize(0))
        .body("guests", hasSize(0));
  }

  @Test
  public void shouldCreateEntityNoUser() throws Exception {
    //default owner to the logged in user
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(), Set.of());

    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("owners", hasItem(hasEntry("id", DEFAULT_TEST_USER_SUBJECT)))
        .body("members", hasSize(0))
        .body("guests", hasSize(0));
  }

  @Test
  public void shouldCreateEntityAdditionalUser() throws Exception {
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(EXTRA_USER), Set.of(), Set.of());

    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("owners", hasItems(hasEntry("id", DEFAULT_TEST_USER_SUBJECT), hasEntry("id", EXTRA_USER)))
        .body("members", hasSize(0))
        .body("guests", hasSize(0));
  }


  @Test
  public void shouldCreateEntityWithMember() throws Exception {
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of());

    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("owners", hasItem(hasEntry("id", DEFAULT_TEST_USER_SUBJECT)))
        .body("members", hasItem(hasEntry("id", EXTRA_USER)))
        .body("guests", hasSize(0));
  }


  @Test
  public void shouldCreateEntityWithGuest() throws Exception {
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(), Set.of(EXTRA_USER));

    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("owners", hasItem(hasEntry("id", DEFAULT_TEST_USER_SUBJECT)))
        .body("members", hasSize(0))
        .body("guests", hasItem(hasEntry("id", EXTRA_USER)));
  }


  @Test
  public void shouldCreateEntityWithMemberAndGuest() throws Exception {
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER));

    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("owners", hasItem(hasEntry("id", DEFAULT_TEST_USER_SUBJECT)))
        .body("members", hasItem(hasEntry("id", EXTRA_USER)))
        .body("guests", hasItem(hasEntry("id", ANOTHER_EXTRA_USER)));
  }

  @Test
  public void failCreateUserInMultipleRoles() throws Exception {
    restClient.expectCreateProjectFailure("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(EXTRA_USER), 400,
        "A user can only hold one project role at a time", null);
    restClient.expectCreateProjectFailure("ProjectDemo", "Demo Project", Set.of(EXTRA_USER), Set.of(), Set.of(EXTRA_USER), 400,
        "A user can only hold one project role at a time", null);
    restClient.expectCreateProjectFailure("ProjectDemo", "Demo Project", Set.of(EXTRA_USER), Set.of(EXTRA_USER), Set.of(), 400,
        "A user can only hold one project role at a time", null);
  }


  @Test
  public void failUpdateUserInMultipleRoles() throws Exception {
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER));

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, id, Set.of(DEFAULT_TEST_USER_SUBJECT),
        Set.of(EXTRA_USER, ANOTHER_EXTRA_USER), Set.of(ANOTHER_EXTRA_USER), 400, "A user can only hold one project role at a time", null);

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, id, Set.of(DEFAULT_TEST_USER_SUBJECT),
        Set.of(EXTRA_USER, DEFAULT_TEST_USER_SUBJECT), Set.of(ANOTHER_EXTRA_USER), 400, "A user can only hold one project role at a time",
        null);

    restClient.updateProjectRoles(DEFAULT_TEST_USER_SUBJECT, id, Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(EXTRA_USER, ANOTHER_EXTRA_USER),
        Set.of());

    restClient.givenDefaultUser().delete("/projects/" + id + "/members/" + ANOTHER_EXTRA_USER).then().statusCode(204);

    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("members", hasItem(hasEntry("id", EXTRA_USER)))
        .body("members", hasSize(1));
  }

  @Test
  public void failDeleteLastOwner() throws Exception {
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER));

    restClient.expectUpdateProjectRolesFailure(DEFAULT_TEST_USER_SUBJECT, id, Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER), 400,
        "Constraint Violation", null);

    restClient.givenDefaultUser().delete("/projects/" + id + "/owners/" + DEFAULT_TEST_USER_SUBJECT).then().statusCode(400);
  }

  @Test
  public void failUpdateEntity() throws Exception {
    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER));

    restClient.givenDefaultUser()
        .body(restClient.createProjectJson("ProjectDemo", "Demo Project change", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER)))
        .put("/projects/" + id)
        .then().statusCode(200).log().body();

    // title changed
    restClient.givenDefaultUser()
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("title", is("ProjectDemo"))
        .body("description", is("Demo Project change"));

    // users not changed
    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("owners", hasItem(hasEntry("id", DEFAULT_TEST_USER_SUBJECT)))
        .body("owners", hasSize(1));
  }

  @Test
  public void shouldPartialUpdateEntity() throws Exception {
    Instant start = Instant.now();

    long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER));

    String path = "/projects/" + id;

    validateNumberOfRevisions(path, 1);
    validateCreatedAndModifiedAudit(start, null, path, DEFAULT_TEST_USER_SUBJECT, DEFAULT_TEST_USER_SUBJECT);

    restClient.givenDefaultUser()
        .body(restClient.createProjectJson("ProjectDemo", "Demo Project change", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER)))
        .put(path)
        .then().statusCode(200).log().body();

    validateNumberOfRevisions(path, 2);
    validateCreatedAndModifiedAudit(start, null, path, DEFAULT_TEST_USER_SUBJECT, DEFAULT_TEST_USER_SUBJECT);

    Instant later = Instant.now();
    restClient.givenDefaultUser()
        .body(restClient.createProjectJson("ProjectDemo", "Demo Project change", Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(EXTRA_USER),
            Set.of(ANOTHER_EXTRA_USER)))
        .put(path)
        .then().statusCode(200).log().body();

    validateNumberOfRevisions(path, 3);
    validateCreatedAndModifiedAudit(start, later, path, DEFAULT_TEST_USER_SUBJECT, DEFAULT_TEST_USER_SUBJECT);

    // title changed
    restClient.givenDefaultUser()
        .get(path)
        .then().statusCode(200)
        .body("title", is("ProjectDemo"))
        .body("description", is("Demo Project change"));

    // users not changed
    restClient.givenDefaultUser()
        .queryParam("projection", "listUsers")
        .get(path)
        .then().statusCode(200)
        .body("owners", hasItem(hasEntry("id", DEFAULT_TEST_USER_SUBJECT)))
        .body("owners", hasSize(1));
  }

 @Test
 public void failRetrieveEntityUnknownUser() throws Exception {
   long id = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER));

   restClient.givenUser("does-not-exist")
       .get("/projects/" + id)
       .then().log().body().statusCode(403);
 }

  @Test
  public void shouldRetrieveEntitiesWithListProjection() throws Exception {
    long projectId = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER));

    long codesetId = restClient.createImportedCodeSet("test code set", "1.2.3", 34);

    long mapId = restClient.createMap("Testing Map Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);

    restClient.givenDefaultUser()
        .queryParam("projection", "listView")
        .get("/projects/" + projectId)
        .then().statusCode(200).log().body()
        .body("id", is((int) projectId))
        .body("mapCount", is(1))
        .body("maps", hasSize(1))
        .body("owners", is(nullValue()));

  }

  @Test
  public void failDeleteEntity() throws Exception {
    long projectId = restClient.createProject("ProjectDemo", "Demo Project", Set.of(), Set.of(EXTRA_USER), Set.of(ANOTHER_EXTRA_USER));

    restClient.givenDefaultUser().delete("/projects/" + projectId).then().statusCode(405);
  }

  @Test
  public void shouldListProjectForUserWithRole() throws Exception {

    String owner = "shouldListProjectForUserWithRole-owner";
    String member = "shouldListProjectForUserWithRole-member";
    String guest = "shouldListProjectForUserWithRole-guest";
    String noRole = "shouldListProjectForUserWithRole-no-role";

    restClient.createOrUpdateUser(owner, "Test", "Bobby", "User", "shouldListProjectForUserWithRole-owner@user.com");
    restClient.createOrUpdateUser(member, "Frank", "Bobby", "Smith", "shouldListProjectForUserWithRole-member@user.com");
    restClient.createOrUpdateUser(guest, "Another", "Bobby", "Smith", "shouldListProjectForUserWithRole-guest@user.com");
    restClient.createOrUpdateUser(noRole, "No", "Bobby", "Role", "shouldListProjectForUserWithRole-no-role@user.com");

    long projectId = restClient.createProject(owner, "ProjectDemo", "Demo Project", Set.of(), Set.of(member), Set.of(guest));

    restClient.givenUser(owner).get("/projects")
        .then().statusCode(200)
        .body("page.totalElements", is(1))
        .body("content", hasSize(1))
        .body("content[0].id", is((int) projectId))
        .body("content[0].title", is("ProjectDemo"));

    restClient.givenUser(member).get("/projects")
        .then().statusCode(200)
        .body("page.totalElements", is(1))
        .body("content", hasSize(1))
        .body("content[0].id", is((int) projectId))
        .body("content[0].title", is("ProjectDemo"));

    restClient.givenUser(guest).get("/projects")
        .then().statusCode(200)
        .body("page.totalElements", is(1))
        .body("content", hasSize(1))
        .body("content[0].id", is((int) projectId))
        .body("content[0].title", is("ProjectDemo"));

    restClient.givenUser(noRole).get("/projects")
        .then().statusCode(200).log().body()
        .body("page.totalElements", is(0))
        .body("content[0].id", is(nullValue()));
  }

  @Test
  public void shouldListAllProjectsForAdmin() throws Exception {
    restClient.createOrUpdateAdminUser(DEFAULT_TEST_ADMIN_USER_SUBJECT, "TestAdmin", "BobbyAdmin", "UserAdmin", "admin@admin.com");
    restClient.createOrUpdateUser("user01", "Test", "Bobby", "User", "user01@user.com");
    restClient.createOrUpdateUser("user02", "Test", "Bobby", "User", "user02@user.com");

    long id1 = restClient.createProject("ProjectDemo1", "Demo Project1", Set.of("user01"), Set.of(), Set.of());
    long id2 = restClient.createProject("ProjectDemo2", "Demo Project2", Set.of("user01"), Set.of(), Set.of());
    long id3 = restClient.createProject("ProjectDemo3", "Demo Project3", Set.of("user02"), Set.of(), Set.of());

    restClient.givenUser("user01")
        .queryParam("projection", "listView")
        .get("/projects")
        .then().statusCode(200)
        .body("page.totalElements", is(2));

    restClient.givenUserWithGroup(DEFAULT_TEST_ADMIN_USER_SUBJECT,
        ContentType.JSON.getContentTypeStrings()[0],
        ContentType.JSON,
        config.getSecurity().getAdminGroup())
        .queryParam("projection", "listView")
        .get("/projects")
        .then().log().ifValidationFails(LogDetail.ALL).statusCode(200)
        .body("page.totalElements", greaterThan(2));
  }
}
