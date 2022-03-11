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

import com.fasterxml.jackson.core.JsonProcessingException;
import io.restassured.filter.log.LogDetail;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.slf4j.event.Level;
import org.snomed.snap2snomed.util.DebugLogger;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.Set;

import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class MethodSecurityIT extends IntegrationTestBase {

    private static final String OWNER_TEST_USER = DEFAULT_TEST_USER_SUBJECT;
    private static final String MEMBER_TEST_USER = "member-user";
    private static final String GUEST_TEST_USER = "guest-user";
    private static final String RANDO_TEST_USER = "rando-user";
    private static final String INVALID_TEST_USER = "invalid-user";

    private Long TEST_PROJECT_ID;
    private Long TEST_CODESET_ID;
    private Long TEST_MAP_ID;

    @Override
    protected void beforeTests() throws IOException {
        DebugLogger.setLevel(Level.INFO);
        restClient.createOrUpdateAdminUser(DEFAULT_TEST_ADMIN_USER_SUBJECT, "Admin", "Nicky", "User", "admin@user.com");
        restClient.createOrUpdateUser(OWNER_TEST_USER, "Test", "Bobby", "User", "test@user.com");
        restClient.createOrUpdateUser(MEMBER_TEST_USER, "Test", "Member", "Member", "member-test@user.com");
        restClient.createOrUpdateUser(GUEST_TEST_USER, "Test", "Guest", "Guest", "guest-test@user.com");
        restClient.createOrUpdateUser(RANDO_TEST_USER, "Test", "Rando", "Rando", "rando-test@user.com");
        Resource fileResource = new ClassPathResource("Pathology Organisms 202103.csv");
        Resource mapFileResource = new ClassPathResource("BBB-test-validate_1.1.csv");
        TEST_PROJECT_ID = restClient.createProject("Testing Project Title", "Testing Project Description",
                Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(MEMBER_TEST_USER), Set.of(GUEST_TEST_USER));
        TEST_CODESET_ID = restClient.createImportedCodeSet("BBB validate targets", "1.0",
                0, 1, true, ",", fileResource.getFile(), "text/csv");
        TEST_MAP_ID = restClient.createMap("1", "http://snomed.info/sct/32506021000036107/version/20210531",
                "http://map.test.toscope", TEST_PROJECT_ID, TEST_CODESET_ID);
    }

    @AfterAll
    protected void afterTests() {
        DebugLogger.setLevel(Level.DEBUG);
    }

    @Test
    public void testInvalidUserCannotCreateMap() throws JsonProcessingException {
        String mapJson = restClient.createMapJson("2",
                "http://snomed.info/sct/32506021000036107/version/20210531",
                "http://map.test.toscope", TEST_PROJECT_ID, TEST_CODESET_ID);
        restClient.givenUser(INVALID_TEST_USER)
                .body(mapJson)
                .post("/maps")
                .then()
                .statusCode(anyOf(is(400), is(401)));
    }

    @Test
    public void testOwnerCanAccessValidProject() {
        restClient.givenUser(OWNER_TEST_USER).get("/projects/" + TEST_PROJECT_ID).then().statusCode(200);
    }

    @Test
    public void testMemberCanAccessValidProject() {
        restClient.givenUser(MEMBER_TEST_USER).get("/projects/" + TEST_PROJECT_ID).then().statusCode(200);
    }

    @Test
    public void testGuestCanAccessValidProject() {
        restClient.givenUser(GUEST_TEST_USER).get("/projects/" + TEST_PROJECT_ID).then().statusCode(200);
    }

    @Test
    public void testAdminCanAccessValidProject() {
        restClient.givenUser(DEFAULT_TEST_ADMIN_USER_SUBJECT).get("/projects/" + TEST_PROJECT_ID).then().statusCode(200);
    }

    @Test
    public void testInvalidUserCannotAccessValidProject() {
        restClient.givenUser(INVALID_TEST_USER).get("/projects/" + TEST_PROJECT_ID).then().statusCode(403);
    }

    @Test
    public void testValidUserCannotAccessUnauthorisedValidProject() {
        restClient.givenUser(RANDO_TEST_USER).get("/projects/" + TEST_PROJECT_ID).then().log().ifValidationFails(LogDetail.ALL).statusCode(403);
    }

    @Test
    public void testOwnerCannotAccessInvalidProject() {
        restClient.givenUser(OWNER_TEST_USER).get("/projects/99999").then().statusCode(403);
    }

    @Test
    public void testOwnerCanAccessValidCodeSet() {
        restClient.givenUser(OWNER_TEST_USER).get("/importedCodeSets/" + TEST_CODESET_ID).then().statusCode(405);
    }

    @Test
    public void testMemberCanAccessValidCodeSet() {
        restClient.givenUser(MEMBER_TEST_USER).get("/importedCodeSets/" + TEST_CODESET_ID).then().statusCode(405);
    }

    @Test
    public void testGuestCanAccessValidCodeSet() {
        restClient.givenUser(GUEST_TEST_USER).get("/importedCodeSets/" + TEST_CODESET_ID).then().statusCode(405);
    }

    @Test
    public void testAdminCanAccessValidCodeSet() {
        restClient.givenUser(DEFAULT_TEST_ADMIN_USER_SUBJECT).get("/importedCodeSets/" + TEST_CODESET_ID).then().statusCode(405);
    }

    @Test
    public void testInvalidUserCannotAccessValidCodeSet() {
        restClient.givenUser(INVALID_TEST_USER).get("/importedCodeSets/" + TEST_CODESET_ID).then().statusCode(403);
    }

    @Test
    public void testValidUserCannotAccessUnauthorisedValidCodeSet() {
        restClient.givenUser(RANDO_TEST_USER).get("/importedCodeSets/" + TEST_CODESET_ID).then().statusCode(403);
    }

    @Test
    public void testOwnerCannotAccessInvalidCodeSet() {
        restClient.givenUser(OWNER_TEST_USER).get("/importedCodeSets/999").then().log().ifValidationFails(LogDetail.ALL).statusCode(403);
    }
    
    @Test
    public void testOwnerCanAccessValidMap() {
        restClient.givenUser(OWNER_TEST_USER).get("/maps/" + TEST_MAP_ID).then().statusCode(200)
                .body("mapVersion", is("1"))
                .body("toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
                .body("toScope", is("http://map.test.toscope"));
    }

    @Test
    public void testMemberCanAccessValidMap() throws IOException {
        restClient.givenUser(MEMBER_TEST_USER).get("/maps/" + TEST_MAP_ID).then().statusCode(200)
                .body("mapVersion", is("1"))
                .body("toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
                .body("toScope", is("http://map.test.toscope"));
    }

    @Test
    public void testGuestCanAccessValidMap() {
        restClient.givenUser(GUEST_TEST_USER).get("/maps/" + TEST_MAP_ID).then().statusCode(200)
                .body("mapVersion", is("1"))
                .body("toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
                .body("toScope", is("http://map.test.toscope"));
    }

    @Test
    public void testAdminCanAccessValidMap() {
        restClient.givenUser(DEFAULT_TEST_ADMIN_USER_SUBJECT).get("/maps/" + TEST_MAP_ID).then().statusCode(200)
                .body("mapVersion", is("1"))
                .body("toVersion", is("http://snomed.info/sct/32506021000036107/version/20210531"))
                .body("toScope", is("http://map.test.toscope"));
    }

    @Test
    public void testInvalidUserCannotAccessValidMap() {
        restClient.givenUser(INVALID_TEST_USER).get("/maps/" + TEST_MAP_ID).then().statusCode(403);
    }

    @Test
    public void testValidUserCannotAccessUnauthorisedValidMap() {
        restClient.givenUser(RANDO_TEST_USER).get("/maps/" + TEST_MAP_ID).then().statusCode(403);
    }

    @Test
    public void testOwnerCannotAccessInvalidMap() {
        restClient.givenUser(OWNER_TEST_USER).get("/maps/99999").then().statusCode(403);
    }
}
