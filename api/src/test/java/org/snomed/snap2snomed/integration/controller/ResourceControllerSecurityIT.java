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
