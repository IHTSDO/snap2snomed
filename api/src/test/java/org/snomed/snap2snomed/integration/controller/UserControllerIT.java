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
import static io.restassured.config.EncoderConfig.encoderConfig;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.springframework.beans.factory.annotation.Autowired;

@TestInstance(Lifecycle.PER_CLASS)
public class UserControllerIT extends IntegrationTestBase {

  @Autowired
  Snap2snomedConfiguration configuration;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
  }

  @Test
  public void updateUser() throws Exception {
    String path = "/users/" + DEFAULT_TEST_USER_SUBJECT;

    validateNumberOfRevisions(path, 1);
    // can't validate the start time because of when the user gets created in the test framework.
    validateCreatedAndModifiedAudit(null, null, path, DEFAULT_TEST_USER_SUBJECT, DEFAULT_TEST_USER_SUBJECT);

    Instant later = Instant.now();

    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "CHANGED_NAME", "test@user.com");

    validateNumberOfRevisions(path, 2);
    validateCreatedAndModifiedAudit(null, later, path, DEFAULT_TEST_USER_SUBJECT, DEFAULT_TEST_USER_SUBJECT);

    restClient.givenDefaultUser().get(path).then().statusCode(200)
        .body("familyName", is("CHANGED_NAME"));
  }

  @Test
  public void unverifiedEmail() throws Exception {
    restClient.expectCreateUserFail("unverified-email", "Foo", "Bobby", "Bar", "foo@bar.com", false, 403)
        .body("detail", is("User's email address is not verified by the identity provider"));
  }


  @Test
  public void differentUserAccessToken() throws Exception {
    String group = IntegrationTestBase.USER_GROUP;
    given()
        .config(RestAssured.config().encoderConfig(encoderConfig().encodeContentTypeAs("application/jwt", ContentType.TEXT)))
        .headers(
            "Authorization",
            "Bearer " + restClient.createAccessToken(DEFAULT_TEST_USER_SUBJECT, group),
            "Content-Type",
            "application/jwt",
            "Accept",
            ContentType.JSON)
        .body(restClient.createIdToken("some-other-id", "Foo", "Bobby", "Bar", "foo@bar.com", true, group))
        .put("/users/token/some-other-id")
        .then().statusCode(403)
        .log().body().body("detail", is("Access token issued for 'test-user' but id token is for 'some-other-id'."));
  }

  @Test
  public void differentUserIDToken() throws Exception {
    String group = IntegrationTestBase.USER_GROUP;
    given()
        .config(RestAssured.config().encoderConfig(encoderConfig().encodeContentTypeAs("application/jwt", ContentType.TEXT)))
        .headers(
            "Authorization",
            "Bearer " + restClient.createAccessToken(DEFAULT_TEST_USER_SUBJECT, group),
            "Content-Type",
            "application/jwt",
            "Accept",
            ContentType.JSON)
        .body(restClient.createIdToken(DEFAULT_TEST_USER_SUBJECT, "Foo", "Bobby", "Bar", "foo@bar.com", true, group))
        .put("/users/token/some-other-id")
        .then().statusCode(403)
        .log().body().body("detail", is("Specified user id some-other-id does not match the token subject test-user."));
  }

  @Test
  public void emptyGivenName() throws Exception {
    restClient.expectCreateUserFail("id", "", "Bobby", "Bar", "foo@bar.com", true, 400)
        .body("violations[0].message", is("Name must be between 1 and 100 characters"));
  }

  @Test
  public void longGivenName() throws Exception {
    restClient.expectCreateUserFail("id", RandomStringUtils.random(101, true, true), "Bobby", "Bar", "foo@bar.com", true, 400)
        .body("violations[0].message", is("Name must be between 1 and 100 characters"));
  }

  @Test
  public void emptyFamilyName() throws Exception {
    restClient.expectCreateUserFail("id", "FOO", "Bobby", "", "foo@bar.com", true, 400)
        .body("violations[0].message", is("Name must be between 1 and 100 characters"));
  }

  @Test
  public void longFamilyName() throws Exception {
    restClient.expectCreateUserFail("id", "FOO", "Bobby", RandomStringUtils.random(101, true, true), "foo@bar.com", true, 400)
        .body("violations[0].message", is("Name must be between 1 and 100 characters"));
  }

  @Test
  public void badEmailAddress() throws Exception {
    restClient.expectCreateUserFail("id", "Foo", "Bobby", "Bar", "foo", true, 400)
        .body("violations[0].message", is("User must have a valid email address"));
  }

  @Test
  public void noEmail() throws Exception {
    restClient.expectCreateUserFail("id", "Foo", "Bobby", "Bar", "", true, 400)
        .body("violations[0].message", is("must not be empty"));
  }

  @Test
  public void acceptTerms() throws Exception {
    UUID id = UUID.randomUUID();
    String path = "/users/" + id;

    restClient.createOrUpdateUser(id.toString(), "Accept", "Bobby", "Terms", "terms@user.com");

    restClient.givenDefaultUser().get(path).then().statusCode(200)
        .body("familyName", is("Terms"))
        .body("acceptedTermsVersion", is(nullValue()));

    restClient.givenUser(id.toString()).post("/users/acceptTerms").then().statusCode(200);

    restClient.givenDefaultUser().get(path).then().statusCode(200)
        .body("familyName", is("Terms"))
        .body("acceptedTermsVersion", is(configuration.getCurrentTermsVersion()));

  }
}
