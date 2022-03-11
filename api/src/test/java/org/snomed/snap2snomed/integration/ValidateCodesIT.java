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

import org.junit.Assert;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.snomed.snap2snomed.controller.dto.MappingImportResponse;
import org.snomed.snap2snomed.controller.dto.ValidationResult;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.text.MessageFormat;
import java.util.Set;

import static org.hamcrest.Matchers.is;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ValidateCodesIT extends IntegrationTestBase {

    private static final String MEMBER_TEST_USER = "member-user";
    private static final String GUEST_TEST_USER = "guest-user";

    Resource mapFileResource;
    Resource fileResource;
    Long projectId;
    Long codeSetId;

    @Override
    protected void beforeTests() throws IOException {
        restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
        fileResource = new ClassPathResource("Pathology Organisms 202103.csv");
        mapFileResource = new ClassPathResource("BBB-test-validate_1.1.csv");
        projectId = restClient.createProject("Testing Project Title", "Testing Project Description",
                Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(), Set.of());
        codeSetId = restClient.createImportedCodeSet("BBB validate targets", "1.0",
                0, 1, true, ",", fileResource.getFile(), "text/csv");
    }

    @Test
    public void validateSampleData() throws Exception {
        Long mapId = restClient.createMap("1", "http://snomed.info/sct/32506021000036107/version/20210731",
                "http://map.test.toscope", projectId, codeSetId);
        MappingImportResponse mappingImportResponse = restClient.createImportedMap(0, 2, 3,
        4, true, ",", mapFileResource.getFile(), "text/csv", mapId);
        Assert.assertEquals(Integer.valueOf(1996), mappingImportResponse.getInsertCount());
        try {
            ValidationResult validationResult = restClient.validateMapTargets(mapId);
            Assert.assertNotNull("Validation result was not returned", validationResult);
        } catch (Exception e) {
            Assert.fail("Example map failed to validate");
        }
    }

    @Test
    public void validateMapWithEclComments() throws IOException {
        Long mapId = restClient.createMap("2", "http://snomed.info/sct/32506021000036107/version/20210731",
                "< 41146007 |Bacterium|", projectId, codeSetId);
        MappingImportResponse mappingImportResponse = restClient.createImportedMap(0, 2, 3,
                4, true, ",", mapFileResource.getFile(), "text/csv", mapId);
        Assert.assertEquals(Integer.valueOf(1996), mappingImportResponse.getInsertCount());
        try {
            ValidationResult validationResult = restClient.validateMapTargets(mapId);
            Assert.assertNotNull("Validation result was not returned", validationResult);
            Assert.assertTrue("Did not find any ACTIVE codes in FHIR server", validationResult.getActiveCount() > 0);
        } catch (Exception e) {
            Assert.fail("Example map failed to validate");
        }
    }
}
