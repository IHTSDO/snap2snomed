package org.snomed.snap2snomed.integration.repository;

import static io.restassured.RestAssured.given;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.Set;
import java.util.stream.Stream;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.snomed.snap2snomed.integration.IntegrationTestBase;

@TestInstance(Lifecycle.PER_CLASS)
public class ResourceSecurityIT extends IntegrationTestBase {

  @ParameterizedTest
  @MethodSource("getResourceParametersForCreate")
  private void forbiddenCreateEntity(String url, String content) throws Exception {
    given().body(content).post(url).then().statusCode(403);
  }

  private Stream<Arguments> getResourceParametersForCreate() throws JsonProcessingException {
    return Stream.of(
        Arguments.of(
            "/projects/1",
            restClient.createProjectJson("ProjectDemo", "Demo Project", Set.of(), Set.of(), Set.of())
        ),
        Arguments.of(
            "/maps/1",
            restClient.createMapJson("MapVersion", "ToVersion", "ToScope", 0L, 0L)
        ),
        Arguments.of(
            "/users/1",
            "{\"name\": \"John Smith\"}"
        )
    );
  }

  @ParameterizedTest
  @MethodSource("getResourceParametersForDelete")
  public void forbiddenDeleteEntity(String url) throws Exception {
    given().delete(url).then().statusCode(403);
  }

  private static Stream<Arguments> getResourceParametersForDelete() {
    return Stream.of(
        Arguments.of("/projects/1"),
        Arguments.of("/maps/1"),
        Arguments.of("/users/1")
    );
  }

  @ParameterizedTest
  @MethodSource("getResourceParametersForPartialUpdate")
  public void forbiddenPartiallyUpdateEntity(String url, String content) throws Exception {
    given().body(content).patch(url).then().statusCode(403);
  }

  private Stream<Arguments> getResourceParametersForPartialUpdate() throws JsonProcessingException {
    return Stream.of(
        Arguments.of("/projects/1",
            restClient.createProjectJson("ProjectDemo", "Demo Project", Set.of(), Set.of(), Set.of())),
        Arguments.of("/maps/1",
            restClient.createMapJson("MapVersion", "ToVersion", "ToScope", 0L, 0L)),
        Arguments.of("/users/1", "{\"name\": \"John Wayne Smith\"}")
    );
  }


  @ParameterizedTest
  @MethodSource("getResourceParametersForUpdate")
  public void forbiddenUpdateEntity(String url, String content) throws Exception {
    given().body(content).put(url).then().statusCode(403);
  }

  private Stream<Arguments> getResourceParametersForUpdate() throws JsonProcessingException {
    return Stream.of(
        Arguments.of("/projects/1",
            restClient.createProjectJson("ProjectDemo", "Demo Project", Set.of(), Set.of(), Set.of())),
        Arguments.of("/maps/1",
            restClient.createMapJson("MapVersion", "ToVersion", "ToScope", 0L, 0L)),
        Arguments.of("/users/1", "{\"name\": \"John Johnson\"}")
    );
  }

  @ParameterizedTest
  @MethodSource("getResourceParametersForQuery")
  public void forbiddenQueryEntity(String url) throws Exception {
    given().get(url).then().statusCode(Matchers.oneOf(403, 401));
  }

  private static Stream<Arguments> getResourceParametersForQuery() {
    return Stream.of(
        Arguments.of("/projects/1"),
        Arguments.of("/projects/1?projection=listview"),
        Arguments.of("/maps/1"),
        Arguments.of("/users/search/findByName?name=John Smith") // returns 401, rest return 403
    );
  }
}
