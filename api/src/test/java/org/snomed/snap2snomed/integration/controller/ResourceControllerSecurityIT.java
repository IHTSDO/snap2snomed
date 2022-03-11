package org.snomed.snap2snomed.integration.controller;

import static io.restassured.RestAssured.given;

import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.integration.IntegrationTestBase;

@TestInstance(Lifecycle.PER_CLASS)
public class ResourceControllerSecurityIT extends IntegrationTestBase {

  @Test
  public void unAuthenticatedShouldFailToUpdateProject() throws Exception {
    given().body(restClient.createProjectJson("Project updated", "Project updated", Set.of(), Set.of(), Set.of()))
        .put("/projects/update/1")
        .then().statusCode(403);
  }

  @Test
  public void unAthenticatedFailCreateUser() throws Exception {
    given().body("fake-token").put("/users/token").then().statusCode(403);
  }
}
