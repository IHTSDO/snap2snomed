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

package org.snomed.snap2snomed.integration;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static io.restassured.RestAssured.given;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import io.jsonwebtoken.io.IOException;

@TestInstance(Lifecycle.PER_CLASS)
public class Snap2SnomedApplicationIT extends IntegrationTestBase {

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
  }

  // no security required
  @Test
  public void actuatorHealthShouldRespondNoAuth() throws Exception {
    given().get("/actuator/health").then().statusCode(200);
  }

  // no security required
  @Test
  public void actuatorInfoShouldRespondNoAuth() throws Exception {
    given().get("/actuator/info").then().statusCode(200);
  }

  @Test
  public void openApiShouldNotRespondNoAuth() throws Exception {
    given().get("/v3/api-docs/swagger-config").then().statusCode(403);
  }

  @Test
  public void openApiShouldRespondAuth() throws Exception {
    restClient.givenDefaultUser().get("/v3/api-docs/swagger-config").then().statusCode(200);
  }

  @Test
  public void swaggerUiShouldNotRespondNoAuth() throws Exception {
    given().get("/swagger-ui/index.html").then().statusCode(403);
  }

  @Test
  public void swaggerUiShouldRespondAuth() throws Exception {
    restClient.givenDefaultUser().get("/swagger-ui/index.html").then().statusCode(200);
  }

  @Test
  public void swaggerUiHtmlShoulNotdRespondNoAuth() throws Exception {
    given().get("/swagger-ui.html").then().statusCode(403);
  }

  @Test
  public void swaggerUiHtmlShouldRespondNoAuth() throws Exception {
    restClient.givenDefaultUser().get("/swagger-ui.html").then().statusCode(200);
  }

  // CORS origin fail
  @Test
  public void corsResponseFail() throws Exception {
    given().headers(
      "Access-Control-Request-Method",
      "GET",
      "Origin",
      "http://www.someurl.com")
    .get("/swagger-ui/index.html").then().statusCode(403)
    .body(is("Invalid CORS request"));
  }

  // CORS works
  @Test
  public void corsResponseOK() throws Exception {
    restClient.givenDefaultUser().headers(
      "Access-Control-Request-Method",
      "GET",
      "Origin",
      "http://localhost")
    .get("/swagger-ui/index.html").then().statusCode(200);
  }  

  // no security required
  @Test
  public void configRespondsOK() throws Exception {
    given().get("/config").then().statusCode(200);
  }
}
