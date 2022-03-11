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

import static io.restassured.RestAssured.given;
import static io.restassured.config.EncoderConfig.encoderConfig;
import static org.hamcrest.Matchers.anything;
import static org.hamcrest.Matchers.hasEntry;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.restassured.RestAssured;
import io.restassured.filter.log.LogDetail;
import io.restassured.http.ContentType;
import io.restassured.response.ResponseBodyExtractionOptions;
import io.restassured.response.ValidatableResponse;
import io.restassured.specification.RequestSpecification;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.text.MessageFormat;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.hamcrest.Matcher;
import org.hamcrest.Matchers;
import org.hamcrest.core.Is;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.controller.dto.MappingImportResponse;
import org.snomed.snap2snomed.controller.dto.ValidationResult;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class Snap2snomedRestClient {

  private static final String PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n"
      + "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCGOBDhbpCM+81S\n"
      + "eZ/BEcZUUrOTIkMyc8Psuf0sN4KDdnfKQX0cjH9VrBt4RhHnZVvZsUqks6opWuyh\n"
      + "pNIqhwphPUQncc5KsaZdNMeGzLycbuuTnNDs7yQMrMjRwA3VXVbOQcIPnBfXME4j\n"
      + "d6OfzGXH7i1LVCMCiW0dpoyNfHik616BQgxihy4dzBqG2wWx5ajAYeJEewG+43dk\n"
      + "mfnyDXdrrazlqUY7/YU5C9+4VSzEs3plwsYcVMOM/cY6WeAqvewnyJ6Gz4HtdM8D\n"
      + "uZGI0zFam0FAeEI3k3PYplCifoH9xR5bTsF6eqMAdyyyZKHTin+ShyfsrM3e/SXy\n"
      + "XkSYHSs/AgMBAAECggEATiSeT2Gb7zk7FWWSSUob+kQcIPG1xc34p/6xE+lNp1R1\n"
      + "8d+nA9QY3rxRUfkZu2sbyuaZ2sJvs5woYQQhCHmO5YZSA9USkhJUFbgA4s6YkUtT\n"
      + "BKIsUYX5qxd95AC5DRxGydcnMQdkKfkJxUSGkybhq0FURaM6ruNsD/NDqaxqYTl/\n"
      + "LnxKbxGEjltbB0qa05hFqPcbxGBF0z247Mak1p4mZJaAD8JUoiEeZuG3igmQSaDD\n"
      + "EReF4DZBPjJTc8SPH8NF6K9LX2iZWN1b1OTBXiwWiRSyM6d/cN6jOFjDv7VowLiM\n"
      + "bbyU4yQ6/swgxtA6xffVpwnm6cYlpbbi5tYgtEF5YQKBgQDJ5AoAaIPAc/yO0Wj8\n"
      + "qH95mvrf8q7pYZMd9tJzdFaZoLP096XB7CG/Trg3mijMcNq0l4dtLCP18Fb3RC+V\n"
      + "R2ncNP+RKx0KibOLXOm8UOrmnUwFRcjILWThK+eKfK0/TDQ+1BRnT57QMts4PXKu\n"
      + "DV8/8Sn2xqyhKeb2QecK3f2xhQKBgQCqMPzx8ubgSSurJOqMA6l7wgvB96adnUv5\n"
      + "R/7aUm7GX1oxnwrr2MUlUlHzISUWehwMglh/4XukcM1xZKCEjxjgBHaHBRf8hOhV\n"
      + "pO3m9wg5NPtRtwtYtJxqv3NqHqvED7qY53x2IjWo+HJ+ipG0Ex7aMXuV3uAAL3Xv\n"
      + "8H4Lk/Ii8wKBgQCToTgbElH9ghMVkFXYI5KLpuN6rWhv6lT83UcI+/JzhorxP8Iq\n"
      + "6vPGg9a7efQJgyC6W+/Ayj1Fk0jUqTyuSTlEuFCFo+Qpl4X+C6Qze2w51J4JYP0w\n"
      + "O9l/um4m24KIPb4aj1SYMyWrkvSwzGY2ljqndD8+YAtOEmj8fDZpwOjJTQKBgBgp\n"
      + "TD+tFEnTGXf6jbHC81S2f6TR272Ujyyco/mqqj9PWiahRZOl+pcJ0MiLdBB01XaR\n"
      + "Kq88+6ikuwXWG1O2XPmwqIMSng0jcTh3aa7Yczpr4yH+soWtXmdpNqFiKVB0SzFZ\n"
      + "67l5sdSDMP31/ilqbX7cd4cXVQWxtzSRF9Pc9QsxAoGAT9ZQ4jRNFniKhunQmGiv\n"
      + "ndUV0BK+gvOrQ7RvSGiwmhysIk2LaKAjKD7iu5uEdYiyeQU2J7W7MZBri2FGV0oB\n"
      + "j2jRdghgSZU9M00AlIvKpHci4Geu1u/ixFjzV6uJ+2m3kbx5UetOe3dZBSnzHE20\n"
      + "EFYgLghDk1xInx/XPdgbnLI=\n"
      + "-----END PRIVATE KEY-----";

  @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
  protected String issuer;

  @Autowired
  Snap2snomedConfiguration config;

  @Autowired
  AuthenticationFacade authenticationFacade;

  @Autowired
  ObjectMapper objectMapper;

  Set<String> adminUser = new HashSet<>();

  private PrivateKey privateKey;

  public Snap2snomedRestClient() throws InvalidKeySpecException, NoSuchAlgorithmException {
    String rsaPrivateKey = PRIVATE_KEY;

    rsaPrivateKey = rsaPrivateKey.replaceAll("\\n", "").replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "");

    PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(rsaPrivateKey));
    KeyFactory kf = null;
    kf = KeyFactory.getInstance("RSA");
    privateKey = kf.generatePrivate(keySpec);
  }

  public RequestSpecification givenDefaultUser() {
    return givenUser(IntegrationTestBase.DEFAULT_TEST_USER_SUBJECT);
  }

  public RequestSpecification givenUser(String subject) {
    return givenUser(subject, adminUser.contains(subject));
  }

  public RequestSpecification givenUser(String subject, boolean admin) {
    return givenUserWithGroup(subject, ContentType.JSON.getContentTypeStrings()[0], ContentType.JSON, admin ? config.getSecurity().getAdminGroup() : "other");
  }

  public RequestSpecification givenUser(String subject, String type, ContentType accept) {
    return givenUser(subject, type, accept.getContentTypeStrings()[0]);
  }

  public RequestSpecification givenUser(String subject, String type, String accept) {
    return given().headers(
        "Authorization",
        "Bearer " + createAccessToken(subject, IntegrationTestBase.USER_GROUP),
        "Content-Type",
        type,
        "Accept",
        accept);
  }

  public RequestSpecification givenUserWithGroup(String subject, String type, ContentType accept, String group) {
    return given().headers(
            "Authorization",
            "Bearer " + createAccessToken(subject, group),
            "Content-Type",
            type,
            "Accept",
            accept);
  }

  public void createOrUpdateUser(String id, String givenName, String nickname, String familyName, String email) {
    String group = IntegrationTestBase.USER_GROUP;
    createOrUpdateUserRequest(id, givenName, nickname, familyName, email, group);
  }

  public void createOrUpdateAdminUser(String id, String givenName, String nickname, String familyName, String email) {
    String group = config.getSecurity().getAdminGroup();
    createOrUpdateUserRequest(id, givenName, nickname, familyName, email, group);
  }

  public void createOrUpdateUserRequest(String id, String givenName, String nickname, String familyName, String email, String group) {
    given()
            .config(RestAssured.config().encoderConfig(encoderConfig().encodeContentTypeAs("application/jwt", ContentType.TEXT)))
            .headers(
                    "Authorization",
                    "Bearer " + createAccessToken(id, group),
                    "Content-Type",
                    "application/jwt",
                    "Accept",
                    ContentType.JSON)
            .body(createIdToken(id, givenName, nickname, familyName, email, true, group))
            .put("/users/token/" + id)
            .then().statusCode(Matchers.oneOf(200, 201))
            .body("givenName", is(givenName))
            .body("familyName", is(familyName))
            .body("nickname", isValueIfNotNull(nickname))
            .body("id", is(id))
            .body("email", is(email));

    if (config.getSecurity().getAdminGroup().equals(group)) {
      adminUser.add(id);
    }
  }

  public ValidatableResponse expectCreateUserFail(String id, String givenName, String nickname, String familyName, String email,
      boolean emailVerified, int statusCode) {
    String group = IntegrationTestBase.USER_GROUP;
    return given()
        .config(RestAssured.config().encoderConfig(encoderConfig().encodeContentTypeAs("application/jwt", ContentType.TEXT)))
        .headers(
            "Authorization",
            "Bearer " + createAccessToken(id, group),
            "Content-Type",
            "application/jwt",
            "Accept",
            ContentType.JSON)
        .body(createIdToken(id, givenName, nickname, familyName, email, emailVerified, group))
        .put("/users/token/" + id)
        .then().statusCode(statusCode);
  }

  public long createProject(String title, String description, Set<String> owners,
      Set<String> members, Set<String> guests) throws JsonProcessingException {
    return createProject(IntegrationTestBase.DEFAULT_TEST_USER_SUBJECT, title, description, owners, members, guests);
  }

  public long createProject(String user, String title, String description, Set<String> owners,
      Set<String> members, Set<String> guests) throws JsonProcessingException {
    long id = create(givenUser(user), createProjectJson(title, description, owners, members, guests), "/projects");

    givenUser(user)
        .get("/projects/" + id)
        .then().log().ifValidationFails(LogDetail.ALL)
        .statusCode(200)
        .body("title", is(title))
        .body("description", is(description));

    int expectedOwnersSize = owners.contains(user) ? owners.size() : owners.size() + 1;

    givenUser(user)
        .queryParam("projection", "listUsers")
        .get("/projects/" + id)
        .then().statusCode(200)
        .body("owners", hasSize(expectedOwnersSize))
        .body("members", hasSize(members.size()))
        .body("guests", hasSize(guests.size()));

    return id;
  }

  public void expectCreateProjectFailure(String title, String description, Set<String> owners, Set<String> members, Set<String> guests,
      int statusCode, String errorTitle, String errorDetail)
      throws JsonProcessingException {

    createExpectFail(givenDefaultUser(), createProjectJson(title, description, owners, members, guests), "/projects", statusCode,
        errorTitle, errorDetail);
  }

  public void updateProjectRoles(String user, long projectId, Set<String> owners, Set<String> members, Set<String> guests)
      throws JsonProcessingException {
    givenUser(user).body(createProjectRoleUpdateJson(owners, members, guests))
        .put("/project/" + projectId + "/roles")
        .then().statusCode(200);

    ValidatableResponse response = givenUser(owners.iterator().next())
        .queryParam("projection", "listUsers")
        .get("/projects/" + projectId)
        .then().statusCode(200)
        .body("owners", hasSize(owners.size()))
        .body("members", hasSize(members.size()))
        .body("guests", hasSize(guests.size()));

    for (String owner : owners) {
      response.body("owners", hasItem(hasEntry("id", owner)));
    }

    for (String member : members) {
      response.body("members", hasItem(hasEntry("id", member)));
    }

    for (String guest : guests) {
      response.body("guests", hasItem(hasEntry("id", guest)));
    }
  }

  public void completeTask(String user, long taskId, int statusCode) {
    givenUser(user).post("/task/" + taskId + "/$complete").then().statusCode(statusCode);
  }

  public ValidatableResponse expectUpdateProjectRolesFailure(String user, long projectId, Set<String> owners, Set<String> members,
      Set<String> guests,
      int statusCode, String title, String detail)
      throws JsonProcessingException {
    return givenUser(user).body(createProjectRoleUpdateJson(owners, members, guests))
        .put("/project/" + projectId + "/roles")
        .then().statusCode(statusCode)
        .body("title", isValueIfNotNull(title))
        .body("detail", isValueIfNotNull(detail));
  }

  private String createProjectRoleUpdateJson(Set<String> owners, Set<String> members, Set<String> guests) throws JsonProcessingException {
    Map<String, Object> map = new HashMap<>();
    map.put("owners", owners.stream().map(o -> User.builder().id(o).build()).collect(Collectors.toList()));
    map.put("members", members.stream().map(o -> User.builder().id(o).build()).collect(Collectors.toList()));
    map.put("guests", guests.stream().map(o -> User.builder().id(o).build()).collect(Collectors.toList()));

    return objectMapper.writeValueAsString(map);
  }

  public long createMap(String mapVersion, String toVersion, String toScope, Long projectId,
      Long importedCodeSetId) throws JsonProcessingException {
    return createMap(IntegrationTestBase.DEFAULT_TEST_USER_SUBJECT, mapVersion, toVersion, toScope, projectId, importedCodeSetId);
  }

  public long createMap(String user, String mapVersion, String toVersion, String toScope, Long projectId,
      Long importedCodeSetId) throws JsonProcessingException {

    return create(givenUser(user), createMapJson(mapVersion, toVersion, toScope, projectId, importedCodeSetId), "/maps");
  }

  public long createNote(String user, Long mapRowId, String noteText) throws JsonProcessingException {

    return create(givenUser(user), createNoteJson(mapRowId, user, noteText), "/notes");
  }

  public long createImportedCodeSet(String name, String version, int numberOfCodes) throws IOException {
    return createImportedCodeSet("map row code", "map row display", name, version, numberOfCodes);
  }

  public long createImportedCodeSet(String mapRowName, String mapRowDisplay,
      String name, String version, int numberOfCodes) throws IOException {
    return createImportedCodeSet(mapRowName, mapRowDisplay, name, version, numberOfCodes, Set.of());
  }

  public long createImportedCodeSet(String mapRowName, String mapRowDisplay,
      String name, String version, int numberOfCodes, Set<Integer> codesToOmit) throws IOException {
    File file = File.createTempFile("s2s", "import-test");

    try (BufferedWriter writer = new BufferedWriter(new FileWriter(file));
        CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT)) {
      for (int i = 1; i <= numberOfCodes; i++) {
        if (!codesToOmit.contains(i)) {
          csvPrinter.printRecord(mapRowName + " " + i + ".", mapRowDisplay + " " + i);
        }
      }
      csvPrinter.flush();
      writer.flush();
    }
    return createImportedCodeSet(name, version, 0, 1, false, ",", file, "text/csv");
  }
  public long createImportedCodeSet(String name, String version, int codeColumnIndex, int displayColumnIndex, boolean hasHeader,
      String delimiter, File file, String fileType)
      throws JsonProcessingException {
        return createImportedCodeSet(IntegrationTestBase.DEFAULT_TEST_USER_SUBJECT, name, version, codeColumnIndex, displayColumnIndex,
                                hasHeader, delimiter, file, fileType);
      }

  public long createImportedCodeSet(String subject, String name, String version, int codeColumnIndex, int displayColumnIndex, boolean hasHeader,
      String delimiter, File file, String fileType)
      throws JsonProcessingException {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("name", name);
    map.put("version", version);
    map.put("codeColumnIndex", codeColumnIndex);
    map.put("displayColumnIndex", displayColumnIndex);
    map.put("hasHeader", hasHeader);
    map.put("delimiter", delimiter);

    return givenUser(subject , ContentType.MULTIPART.getContentTypeStrings()[0], ContentType.JSON)
        .multiPart("file", file, fileType)
        .multiPart("importDetails", objectMapper.writeValueAsString(map), "application/json")
        .post("/importedCodeSets/import")
        .then()
        .statusCode(200)
        .extract().body().jsonPath().getLong("id");
  }

  public void expectCreateImportedCodeSetFail(String name, String version, int codeColumnIndex, int displayColumnIndex, boolean hasHeader,
      String delimiter, File file, String fileType, int status, String errorUri)
      throws JsonProcessingException {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("name", name);
    map.put("version", version);
    map.put("codeColumnIndex", codeColumnIndex);
    map.put("displayColumnIndex", displayColumnIndex);
    map.put("hasHeader", hasHeader);
    map.put("delimiter", delimiter);

    given().headers(
            "Authorization", "Bearer " + createAccessToken(IntegrationTestBase.DEFAULT_TEST_USER_SUBJECT,
                            IntegrationTestBase.USER_GROUP),
            "Content-Type", ContentType.MULTIPART,
            "Accept", ContentType.JSON)
        .multiPart("file", file, fileType)
        .multiPart("importDetails", objectMapper.writeValueAsString(map), "application/json")
        .post("/importedCodeSets/import")
        .then()
        .statusCode(status)
        .body("type", isValueIfNotNull(errorUri));
  }

  public MappingImportResponse createImportedMap(int codeColumnIndex, int targetColumnIndex, int targetDisplayColumnIndex,
      int relationshipColumnIndex, boolean hasHeader, String delimiter, File file, String fileType, Long mapId)
      throws JsonProcessingException {
    java.util.Map<String, Object> map = new HashMap<>();

    map.put("codeColumnIndex", codeColumnIndex);
    map.put("targetCodeColumnIndex", targetColumnIndex);
    map.put("targetDisplayColumnIndex", targetDisplayColumnIndex);
    map.put("relationshipColumnIndex", relationshipColumnIndex);
    map.put("hasHeader", hasHeader);
    map.put("delimiter", delimiter);
    map.put("mapId", mapId);

    MappingImportResponse mappingImportResponse = new MappingImportResponse();
    ResponseBodyExtractionOptions responseBody = given().headers(
      "Authorization", "Bearer " + createAccessToken(IntegrationTestBase.DEFAULT_TEST_USER_SUBJECT, IntegrationTestBase.USER_GROUP),
      "Content-Type", ContentType.MULTIPART,
      "Accept", ContentType.JSON)
        .multiPart("file", file, fileType)
        .multiPart("importDetails", objectMapper.writeValueAsString(map), "application/json")
        .post("/importedMappings/import")
        .then()
        .statusCode(200)
        .extract().body();
    mappingImportResponse.setInsertCount(responseBody.jsonPath().getInt("insertCount"));
    mappingImportResponse.setRecordCount(responseBody.jsonPath().getLong("recordCount"));
    return mappingImportResponse;
  }

  public void expectCreateImportedMapFail(int codeColumnIndex, int targetColumnIndex, int targetDisplayColumnIndex,
      int relationshipColumnIndex, boolean hasHeader, String delimiter, File file, String fileType, Long mapId,
      int status, String errorUri, String subject)
      throws JsonProcessingException {
    java.util.Map<String, Object> map = new HashMap<>();

    map.put("codeColumnIndex", codeColumnIndex);
    map.put("targetCodeColumnIndex", targetColumnIndex);
    map.put("targetDisplayColumnIndex", targetDisplayColumnIndex);
    map.put("relationshipColumnIndex", relationshipColumnIndex);
    map.put("hasHeader", hasHeader);
    map.put("delimiter", delimiter);
    map.put("mapId", mapId);

    given().headers(
      "Authorization", "Bearer " + createAccessToken(subject, IntegrationTestBase.USER_GROUP),
      "Content-Type", ContentType.MULTIPART,
      "Accept", ContentType.JSON)
        .multiPart("file", file, fileType)
        .multiPart("importDetails", objectMapper.writeValueAsString(map), "application/json")
        .post("/importedMappings/import")
        .then()
        .statusCode(status)
        .body("type", isValueIfNotNull(errorUri));
  }

  public long createTask(TaskType type, long mapId, String user, String sourceRowSpecification)
      throws JsonProcessingException {
    return createTask(IntegrationTestBase.DEFAULT_TEST_USER_SUBJECT, type, mapId, user, sourceRowSpecification, false, false, null);
  }

  public long createTask(String user, TaskType type, long mapId, String assignee, String sourceRowSpecification,
      boolean allowAssigneeToBeAuthorAndReviewer, boolean reassignAlreadyAssignedRows, String description) throws JsonProcessingException {

    return create(givenUser(user),
        createTaskJson(type, mapId, assignee, sourceRowSpecification, allowAssigneeToBeAuthorAndReviewer, reassignAlreadyAssignedRows,
            description),
        "/tasks");
  }

  public long createTask(String user, TaskType type, Long mapId, String assignee, String sourceRowSpecification,
      boolean allowAssigneeToBeAuthorAndReviewer, boolean reassignAlreadyAssignedRows, String description) throws JsonProcessingException {
    return create(givenUser(user),
        createTaskJson(type, mapId, assignee, sourceRowSpecification, allowAssigneeToBeAuthorAndReviewer, reassignAlreadyAssignedRows,
            description),
        "/tasks");
  }

  public void expectCreateTaskFailure(String user, TaskType type, long mapId, String assignee, String sourceRowSpecification,
      boolean allowAssigneeToBeAuthorAndReviewer, boolean reassignAlreadyAssignedRows, String description, int statusCode, String title)
      throws JsonProcessingException {

    createExpectFail(givenUser(user),
        createTaskJson(type, mapId, assignee, sourceRowSpecification, allowAssigneeToBeAuthorAndReviewer, reassignAlreadyAssignedRows,
            description),
        "/tasks", statusCode, title, null);
  }

  public void expectCreateTaskFailure(String user, TaskType type, long mapId, String assignee, String sourceRowSpecification,
      boolean allowAssigneeToBeAuthorAndReviewer, boolean reassignAlreadyAssignedRows, String description, int statusCode, String title,
      String detail)
      throws JsonProcessingException {

    createExpectFail(givenUser(user),
        createTaskJson(type, mapId, assignee, sourceRowSpecification, allowAssigneeToBeAuthorAndReviewer, reassignAlreadyAssignedRows,
            description),
        "/tasks", statusCode, title, detail);
  }

  public void updateTask(String user, long taskId, TaskType type, long mapId, String assignee, String sourceRowSpecification,
      boolean allowAssigneeToBeAuthorAndReviewer, boolean reassignAlreadyAssignedRows, String description) throws JsonProcessingException {

    givenUser(user).body(
            createTaskJson(type, mapId, assignee, sourceRowSpecification, allowAssigneeToBeAuthorAndReviewer, reassignAlreadyAssignedRows,
                description))
        .put("/tasks/" + taskId)
        .then().statusCode(200);

  }

  public long getMapRowId(long mapId, String code) {
    return givenDefaultUser()
        .queryParam("sourceCode", code)
        .get("/mapView/" + mapId)
        .then().statusCode(200)
        .body("content[0]", hasKey("rowId"))
        .extract().body()
        .jsonPath().getLong("content[0].rowId");
  }

  public long getMapRowTargetId(long mapId, String code) {
    return givenDefaultUser()
        .queryParam("targetCode", code)
        .get("/mapView/" + mapId)
        .then().statusCode(200)
        .body("content[0]", hasKey("targetId"))
        .extract().body()
        .jsonPath().getLong("content[0].targetId");
  }

  public void checkLastModified(long mapRowId, String role, String user) {
    ValidatableResponse response = givenDefaultUser().get("/mapRows/" + mapRowId + "/" + role)
        .then();

    if (user != null) {
      response.statusCode(200).body("id", Is.is(user));
    } else {
      response.statusCode(404);
    }
  }

  public void checkStatus(long mapRowId, MapStatus status) {
    givenDefaultUser()
        .get("/mapRows/" + mapRowId)
        .then().statusCode(200)
        .body("status", Is.is(status.toString()));
  }

  public void updateStatus(String user, long mapRowId, MapStatus status) throws JsonProcessingException {
    updateNoMapAndStatus(user, mapRowId, null, status, 200, null);
  }

  public void updateStatus(String user, long mapRowId, MapStatus status, int statusCode, String detail) throws JsonProcessingException {
    updateNoMapAndStatus(user, mapRowId, null, status, statusCode, detail);
  }

  public void updateNoMapAndStatus(String user, long mapId, String sourceCode, Boolean noMap, MapStatus status)
      throws JsonProcessingException {
    updateNoMapAndStatus(user, getMapRowId(mapId, sourceCode), noMap, status, 200, null);
  }

  public void updateNoMapAndStatus(String user, long mapRowId, Boolean noMap, MapStatus status)
      throws JsonProcessingException {
    updateNoMapAndStatus(user, mapRowId, noMap, status, 200, null);
  }

  public void updateNoMapAndStatus(String user, long mapRowId, Boolean noMap, MapStatus status, int statusCode, String detail)
      throws JsonProcessingException {

    Map<String, Object> map = new HashMap<>();
    if (noMap != null) {
      map.put("noMap", noMap);
    }
    if (status != null) {
      map.put("status", status);
    }

    if (map.isEmpty()) {
      throw new RuntimeException("Patch is empty, set noMap or status");
    }

    givenUser(user)
        .body(objectMapper.writeValueAsString(map))
        .patch("/mapRows/" + mapRowId)
        .then().statusCode(statusCode)
        .body("detail", isValueIfNotNull(detail));

    if (statusCode == 200) {
      givenUser(user)
          .get("/mapRows/" + mapRowId)
          .then().statusCode(200)
          .body("noMap", isValueIfNotNull(noMap))
          .body("status", isValueIfNotNull(status.toString()));
    }
  }

  public long createTarget(String user, long mapId, String code, String targetCode, String targetDisplay, MappingRelationship relationship,
      boolean flagged) throws JsonProcessingException {
    long mapRowId = getMapRowId(mapId, code);

    return createTarget(user, mapRowId, targetCode, targetDisplay, relationship, flagged, 201);
  }

  public long createTarget(String user, long mapRowId, String targetCode, String targetDisplay, MappingRelationship relationship,
      boolean flagged, int expectedStatusCode) throws JsonProcessingException {

    java.util.Map<String, Object> map = new HashMap<>();
    map.put("row", "/mapRows/" + mapRowId);
    map.put("targetCode", targetCode);
    map.put("targetDisplay", targetDisplay);
    map.put("relationship", relationship);
    map.put("flagged", flagged);

    ValidatableResponse response = givenUser(user)
        .body(objectMapper.writeValueAsString(map))
        .post("/mapRowTargets")
        .then().statusCode(expectedStatusCode);

    if (expectedStatusCode == 201) {
      return response.extract().body().jsonPath().getLong("id");
    } else {
      return -1;
    }
  }

  public void updateTarget(String user, long targetId, String targetCode, String targetDisplay, MappingRelationship relationship,
      boolean flagged, int expectedStatusCode) throws JsonProcessingException {

    java.util.Map<String, Object> map = new HashMap<>();
    map.put("targetCode", targetCode);
    map.put("targetDisplay", targetDisplay);
    map.put("relationship", relationship);
    map.put("flagged", flagged);

    ValidatableResponse response = givenUser(user)
        .body(objectMapper.writeValueAsString(map))
        .patch("/mapRowTargets/" + targetId)
        .then().statusCode(expectedStatusCode);
  }

  public void deleteTarget(String user, long mapId, String code, boolean noMap, MapStatus status) {

  }

  public void updateTargetFlag(String user, long mapRowTargetId, boolean flagged, int statusCode) throws JsonProcessingException {
      java.util.Map<String, Object> map = new HashMap<>();
      map.put("flagged", flagged);

      givenUser(user)
          .body(objectMapper.writeValueAsString(map))
          .patch("/mapRowTargets/" + mapRowTargetId)
          .then().statusCode(statusCode);
  }

  public String createTaskJson(TaskType type, long mapId, String assignee, String sourceRowSpecification,
      boolean allowAssigneeToBeAuthorAndReviewer, boolean reassignAlreadyAssignedRows, String description)
      throws JsonProcessingException {
    Map<String, Object> map = new HashMap<>();
    map.put("type", type);
    map.put("allowAssigneeToBeAuthorAndReviewer", allowAssigneeToBeAuthorAndReviewer);
    map.put("reassignAlreadyAssignedRows", reassignAlreadyAssignedRows);
    map.put("sourceRowSpecification", sourceRowSpecification);
    map.put("description", description);
    map.put("map", "/maps/" + mapId);
    map.put("assignee", "/users/" + assignee);
    return objectMapper.writeValueAsString(map);
  }

  public void deleteTask(Long taskId) {
    deleteTask(IntegrationTestBase.DEFAULT_TEST_USER_SUBJECT, taskId);
  }

  public void deleteTask(String user, Long taskId) {
    givenUser(user).delete("/tasks/" + taskId).then().statusCode(204);
  }

  public void expectDeleteTaskFailure(String user, Long taskId, int statusCode) {
    givenUser(user).delete("/tasks/" + taskId).then().statusCode(statusCode);
  }

  public String createProjectJson(String title, String description, Set<String> owners, Set<String> members, Set<String> guests)
      throws JsonProcessingException {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("title", title);
    map.put("description", description);
    if (owners != null) {
      map.put("owners", owners.stream().map(o -> "/users/" + o).collect(Collectors.toList()));
    }
    if (members != null) {
      map.put("members", members.stream().map(o -> "/users/" + o).collect(Collectors.toList()));
    }
    if (guests != null) {
      map.put("guests", guests.stream().map(o -> "/users/" + o).collect(Collectors.toList()));
    }
    return objectMapper.writeValueAsString(map);
  }

  public String createMapJson(String mapVersion, String toVersion, String toScope, Long projectId, Long importedCodeSetId)
      throws JsonProcessingException {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("mapVersion", mapVersion);
    map.put("toVersion", toVersion);
    map.put("toScope", toScope);
    map.put("project", "/projects/" + projectId);
    map.put("source", "/importedCodeSet/" + importedCodeSetId);
    return objectMapper.writeValueAsString(map);
  }

  public String createMapJson(Long mapId, String mapVersion, String toVersion, String toScope, Long projectId, Long importedCodeSetId)
      throws JsonProcessingException {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("id", mapId);
    map.put("mapVersion", mapVersion);
    map.put("toVersion", toVersion);
    map.put("toScope", toScope);
    map.put("project", "/projects/" + projectId);
    map.put("source", "/importedCodeSet/" + importedCodeSetId);
    return objectMapper.writeValueAsString(map);
  }

  public String createNoteJson(Long mapRowId, String userId, String noteText)
      throws JsonProcessingException {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("mapRow", "/mapRows/" + mapRowId);
    map.put("noteBy", "/users/" + userId);
    map.put("noteText", noteText);
    return objectMapper.writeValueAsString(map);
  }

  public String createAccessToken(String subject, String group) {
    Date now = new Date();

    //Let's set the JWT Claims
    JwtBuilder builder = Jwts.builder()
        .setId("123")
        .setIssuedAt(now)
        .setSubject(subject)
        .setIssuer(issuer)
        .setExpiration(Date.from(now.toInstant().plusSeconds(3600)))
        .setHeaderParam("kid", MockAuthorizationServer.KEY_ID)
        .addClaims(java.util.Map.of("client_id", config.getSecurity().getClientId(), "cognito:groups", group))
        .signWith(privateKey);

    //Builds the JWT and serializes it to a compact, URL-safe string
    return builder.compact();
  }

  public String createIdToken(String id, String givenName, String nickname, String familyName, String email,
      boolean emailVerified, String group) {
    Date now = new Date();

    //Let's set the JWT Claims
    JwtBuilder builder = Jwts.builder()
        .setId("123")
        .setIssuedAt(now)
        .setSubject(id)
        .setIssuer(issuer)
        .setExpiration(Date.from(now.toInstant().plusSeconds(3600)))
        .setHeaderParam("kid", MockAuthorizationServer.KEY_ID)
        .addClaims(Map.of(
            "email_verified", emailVerified,
            "given_name", givenName,
            "nickname", nickname,
            "family_name", familyName,
            "email", email,
            "cognito:groups", group
        ))
        .signWith(privateKey);

    //Builds the JWT and serializes it to a compact, URL-safe string
    return builder.compact();
  }

  private long create(RequestSpecification requestSpecification, String json, String url) throws JsonProcessingException {
    return requestSpecification
        .body(json)
        .post(url)
        .then()
        .log().ifValidationFails(LogDetail.ALL)
        .statusCode(201)
        .extract().body().jsonPath().getLong("id");
  }

  private void createExpectFail(RequestSpecification requestSpecification, String json, String url, int code, String title, String detail)
      throws JsonProcessingException {
    requestSpecification
        .body(json)
        .post(url)
        .then()
        .statusCode(code)
        .body("title", isValueIfNotNull(title))
        .body("detail", isValueIfNotNull(detail));
  }

  private Matcher<?> isValueIfNotNull(Object value) {
    return value == null ? is(anything()) : is(value);
  }

  public void deleteAllTasks() {
    givenDefaultUser().get("/tasks").then().log().ifValidationFails(LogDetail.ALL).statusCode(200)
        .extract().body().jsonPath()
        .getList("content.id", String.class).forEach(id -> {
          try {
            Long lid = Long.parseLong(id);
            deleteTask(lid);
          } catch (NumberFormatException e) {
            // nothing to do
          }
        });
  }

  public String createUserJson(String givenName, String familyName, String nickname, String email) throws JsonProcessingException {
    Map<String, Object> map = new HashMap<>();
    map.put("givenName", givenName);
    map.put("familyName", familyName);
    map.put("nickname", nickname);
    map.put("email", email);

    return objectMapper.writeValueAsString(map);
  }

  public ValidationResult validateMapTargets(Long mapId) {
    return givenDefaultUser().get(MessageFormat.format("/map/{0}/validateTargetCodes", mapId))
            .then().statusCode(is(200))
            .extract().body().as(ValidationResult.class);
  }

}
