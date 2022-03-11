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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.integration.IntegrationTestBase;

@TestInstance(Lifecycle.PER_CLASS)
public class UserResourceIT extends IntegrationTestBase {

  private static final String INVALID_TEST_USER = "invaid-user";

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
  }

  @Test
  public void getAllowedOnlyForValidUsers() throws Exception {
    restClient.givenDefaultUser().get("/users")
       .then().statusCode(200);
    restClient.givenUser(INVALID_TEST_USER).get("/users")
       .then().statusCode(403);
  }

  @Test
  public void postNotAllowed() throws Exception {
    restClient.givenDefaultUser().body(restClient.createUserJson("John", "Smith", "Jo", "foo@bar.com"))
        .post("/users").then().statusCode(405);
  }

  @Test
  public void deleteNotAllowed() throws Exception {
    restClient.createOrUpdateUser("test", "Test", "Bobby", "User", "foo@bar.com");

    restClient.givenDefaultUser().delete("/users/test").then().statusCode(405);
  }

  @Test
  public void putNotAllowed() throws Exception {
    restClient.createOrUpdateUser("test", "Test", "Bobby", "User", "foo@bar.com");

    restClient.givenDefaultUser().body(restClient.createUserJson("John", "Smith", "Jo", "foo@bar.com"))
        .put("/users/test").then().statusCode(405);
  }

  @Test
  public void patchNotAllowed() throws Exception {
    restClient.createOrUpdateUser("test", "Test", "Bobby", "User", "foo@bar.com");

    restClient.givenDefaultUser().body(restClient.createUserJson("John", "Smith", "Jo", "foo@bar.com"))
        .patch("/users/test").then().statusCode(405);
  }

  @Test
  public void shouldFailCreateEntityBadName() throws Exception {
    restClient.expectCreateUserFail("bad-name", "", "Bobby", "Smith", "foo@bar.com", true, 400);
  }

  @Test
  public void shouldFailCreateEntityBadEmail() throws Exception {
    restClient.expectCreateUserFail("bad-name", "John", "Bobby", "Smith", "foo", true, 400);
  }


}
