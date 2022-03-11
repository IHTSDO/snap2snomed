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

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.lessThan;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.RestAssured;
import io.restassured.config.ObjectMapperConfig;
import io.restassured.config.RestAssuredConfig;
import io.restassured.response.ValidatableResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Comparator;
import javax.annotation.PostConstruct;
import org.hamcrest.Matcher;
import org.hamcrest.comparator.ComparatorMatcherBuilder;
import org.mockserver.integration.ClientAndServer;
import org.snomed.snap2snomed.Snap2snomedApplication;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MySQLContainer;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = Snap2snomedApplication.class)
@ActiveProfiles("test")
public class IntegrationTestBase {

  public static final MySQLContainer database = Snap2SnomedMySqlContainer.getInstance();

  public static final String DEFAULT_TEST_USER_SUBJECT = "test-user";
  public static final String DEFAULT_TEST_ADMIN_USER_SUBJECT = "test-admin";

  public static final String USER_GROUP = "abc123";

  @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
  protected String issuer;

  @Autowired
  Snap2snomedConfiguration config;

  @Autowired
  protected Snap2snomedRestClient restClient;

  @LocalServerPort
  int randomServerPort;
  
  @Autowired
  @Qualifier("mockAuthServer")
  protected ClientAndServer mockAuthServer;
  
  @PostConstruct
  private void setupPort() throws IOException {
    RestAssured.port = randomServerPort;
    RestAssured.config = RestAssuredConfig.config().objectMapperConfig(new ObjectMapperConfig().jackson2ObjectMapperFactory(
        (type, s) -> {
          ObjectMapper om = new ObjectMapper().findAndRegisterModules();
          om.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
          return om;
        }
    ));
    beforeTests();
  }

  public IntegrationTestBase() {
    database.start();
  }

  protected void beforeTests() throws IOException {
  }

  protected Matcher<Number> isLongValue(long expected) {
    return ComparatorMatcherBuilder
        .comparedBy(Comparator.comparingDouble(Number::longValue))
        .comparesEqualTo(expected);
  }

  protected void validateNumberOfRevisions(String path, int size) {
    restClient.givenDefaultUser().log().all()
        .get(path + "/revisions")
        .then().log().all().statusCode(200)
        .body("content", hasSize(size));
  }

  protected void validateCreatedAndModifiedAudit(Instant now, Instant later, String path, String createdBy, String modifiedBy) {
    ValidatableResponse response = restClient.givenDefaultUser()
        .get(path)
        .then().log().all().statusCode(200)
//        .header("Etag", is("\"0\"")) Etag support requires changes to the handlers to support @Version
        .body("createdBy", is(createdBy))
        .body("modifiedBy", is(modifiedBy));

    if (now != null) {
      response.body("created", is(greaterThan(now.toString())))
          .body("modified", is(greaterThan(now.toString())));
    }

    if (later != null) {
      response.body("created", is(lessThan(later.toString())))
          .body("modified", is(greaterThan(later.toString())));
    }
  }

}
