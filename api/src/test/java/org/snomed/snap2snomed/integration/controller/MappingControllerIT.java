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

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.snomed.snap2snomed.service.FhirService.isValidSctId;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.response.ValidatableResponse;
import io.restassured.specification.RequestSpecification;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.builder.CompareToBuilder;
import org.ihtsdo.snomed.util.rf2.schema.RF2SchemaConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.controller.dto.MappedRowDetailsDto;
import org.snomed.snap2snomed.controller.dto.MappingDetails;
import org.snomed.snap2snomed.controller.dto.MappingDto;
import org.snomed.snap2snomed.controller.dto.MappingUpdateDto;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.snomed.snap2snomed.model.MapView;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.springframework.beans.factory.annotation.Autowired;

@TestInstance(Lifecycle.PER_CLASS)
@Slf4j
public class MappingControllerIT extends IntegrationTestBase {

  public static final String TARGET_OUT_OF_SCOPE_TAG = "target-out-of-scope";
  @Autowired
  ObjectMapper objectMapper;

  private long taskId, task2Id;

  private String user = "another-test-user";

  private long projectId, mapId;
  private long codesetId;

  private int version = 1;
  private String mapVersion;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(user, "Bob", "Bobby", "Bob", "u2@csiro.au");

    projectId = restClient.createProject("ProjectDemo", "Demo Project", Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(user), Set.of());

    codesetId = restClient.createImportedCodeSet("test code set", "1.2.3", 34);
  }

  @BeforeEach
  protected void beforeEachTest() throws IOException {
    mapVersion = "Testing Map Version " + (version++);
    mapId = restClient.createMap(mapVersion, "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);

    taskId = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "*",
        false, false, "Test description");

    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 1.", "abc", "XYZ", MappingRelationship.TARGET_INEXACT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 1.", "def", "D E F", MappingRelationship.TARGET_INEXACT, false);
    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 1.", false, MapStatus.MAPPED);

    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 2.", true, MapStatus.DRAFT);
    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 3.", true, MapStatus.DRAFT);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 4.", "broader", "broader", MappingRelationship.TARGET_BROADER,
        true);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 5.", "narrower", "Narrower",
        MappingRelationship.TARGET_NARROWER, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 6.", "equivalent", "Equivalent",
        MappingRelationship.TARGET_EQUIVALENT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 7.", "equivalent2", "Equivalent",
        MappingRelationship.TARGET_INEXACT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 8.", "utf8", "ሰማይ አይታረስ ንጉሥ አይከሰስ።",
        MappingRelationship.TARGET_EQUIVALENT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 9.", "quotes",
        "This is a bit of text that has \"quotes\", as well as some commas to stir things up", MappingRelationship.TARGET_EQUIVALENT,
        false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 10.", "tabby",
        "This display has a tab \t to ensure this is handled", MappingRelationship.TARGET_EQUIVALENT, false);
    restClient.createTarget(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 11.", "inreview", "in review row",
        MappingRelationship.TARGET_EQUIVALENT, false);
    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 11.", false, MapStatus.MAPPED);

    restClient.createNote(DEFAULT_TEST_USER_SUBJECT, restClient.getMapRowId(mapId, "map row code 11."), "Some note");

    restClient.deleteTask(taskId);

    taskId = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, DEFAULT_TEST_USER_SUBJECT, "*",
        true, false, "Test description");

    restClient.updateNoMapAndStatus(DEFAULT_TEST_USER_SUBJECT, mapId, "map row code 11.", false, MapStatus.INREVIEW);

    restClient.deleteTask(taskId);

    taskId = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, DEFAULT_TEST_USER_SUBJECT, "1-5,3,7,15,10-20",
        true, false, "Test description");

    task2Id = restClient.createTask(user, TaskType.REVIEW, mapId, user, "21-25",
        false, false, "foo");

  }


  @Test
  public void failNoMapAndStatusChangeAllRows() throws Exception {
    MappingDto nomapDto = MappingDto.builder().noMap(true).status(MapStatus.UNMAPPED).build();
    expectFail("/updateMapping/map/" + mapId, nomapDto, 400,
        "Invalid combination of changes. Clear/set 'no map' and clearing targets must be done independently of any other changes");
    expectFail("/updateMapping/task/" + taskId, nomapDto, 400,
        "Invalid combination of changes. Clear/set 'no map' and clearing targets must be done independently of any other changes");
  }


  @Test
  public void failNoMapAndStatusChangeSelectedRows() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    MappingDto nomapDto = MappingDto.builder().noMap(true).status(MapStatus.UNMAPPED).build();
    List<MapView> mapViews = getMapViews();
    mappingDetails.add(
        MappingDetails.builder().rowId(mapViews.get(0).getRowId()).taskId(taskId).mappingUpdate(nomapDto).build());
    mappingDetails.add(
        MappingDetails.builder().rowId(mapViews.get(1).getRowId()).taskId(taskId).mappingUpdate(nomapDto).build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail("/updateMapping", mappingUpdate, 400,
        "Invalid combination of changes. Clear/set 'no map' and clearing targets must be done independently of any other changes");
  }


  @Test
  public void shouldBulkNoMapAllRows() throws Exception {
    MappingDto nomapDto = MappingDto.builder().noMap(true).build();
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/map/" + mapId, nomapDto, 35, 34);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/task/" + taskId, nomapDto, 17, 16);
  }


  @Test
  public void shouldBulkNoMapSelectedRows() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    MappingDto nomapDto = MappingDto.builder().noMap(true).build();
    List<MapView> mapViews = getMapViews();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(0).getRowId()).taskId(taskId).mappingUpdate(nomapDto).build());
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(11).getRowId()).taskId(taskId).mappingUpdate(nomapDto).build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping", mappingUpdate, 2, 1);
  }


  @Test
  public void shouldBulkChangeStatusAll() throws Exception {
    MappingDto nomapDto = MappingDto.builder().status(MapStatus.REJECTED).build();
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/map/" + mapId, nomapDto, 35, 3);
    // 3 updates - 1st row has two maprowtargets and there is an inreview status for row 11
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/task/" + taskId, nomapDto, 18, 0);
    checkRowCounts(user, "/updateMapping/task/" + task2Id, nomapDto, 5, 0);
    nomapDto = MappingDto.builder().status(MapStatus.MAPPED).build();
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/task/" + taskId, nomapDto, 18, 6);
  }


  @Test
  public void shouldBulkChangeStatusSelected() throws Exception {
    MappingDto nomapDto = MappingDto.builder().status(MapStatus.DRAFT).build();
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    mappingDetails.add(
        MappingDetails.builder().rowId(restClient.getMapRowId(mapId, "map row code 2.")).taskId(taskId).mappingUpdate(nomapDto).build());
    mappingDetails.add(
        MappingDetails.builder().rowId(restClient.getMapRowId(mapId, "map row code 4.")).taskId(taskId).mappingUpdate(nomapDto).build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping", mappingUpdate, 2, 1);
  }

  @Test
  public void shouldBulkChangeStatusSelection() throws Exception {
    MappingDto nomapDto = MappingDto.builder().status(MapStatus.DRAFT).build();
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MappedRowDetailsDto> selection = new ArrayList<MappedRowDetailsDto>();
    selection.add(MappedRowDetailsDto.builder()
      .mapRowId(restClient.getMapRowId(mapId, "map row code 4."))
      .mapRowTargetId(restClient.getMapRowTargetId(mapId, "broader"))
      .build());
    selection.add(MappedRowDetailsDto.builder()
      .mapRowId(restClient.getMapRowId(mapId, "map row code 5."))
      .mapRowTargetId(restClient.getMapRowTargetId(mapId, "narrower"))
      .build());
    selection.add(MappedRowDetailsDto.builder()
      .mapRowId(restClient.getMapRowId(mapId, "map row code 7."))
      .mapRowTargetId(restClient.getMapRowTargetId(mapId, "equivalent2"))
      .build());
    mappingDetails.add(
        MappingDetails.builder().selection(selection).mappingUpdate(nomapDto).build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMappingForSelected", mappingUpdate, 3, 3);
  }

  @Test
  public void shouldClearTargetsForMap() throws Exception {
    MappingDto nomapDto = MappingDto.builder().clearTarget(true).build();
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/map/" + mapId, nomapDto, 35, 9);
  }


  @Test
  public void shouldClearTargetsForTask() throws Exception {
    MappingDto nomapDto = MappingDto.builder().clearTarget(true).build();
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/task/" + taskId, nomapDto, 18, 6);
  }


  @Test
  public void shouldClearTargetsSelected() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    mapViews.stream()
        .filter(mapView -> mapView.getTargetId() != null)
        .collect(Collectors.toList())
        .forEach(mapView -> {
          MappingDto nomapDto = MappingDto.builder().clearTarget(true).targetId(mapView.getTargetId()).build();
          mappingDetails.add(MappingDetails.builder().rowId(mapView.getRowId()).mappingUpdate(nomapDto).build());
        });
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping", mappingUpdate, 10, 9);
  }

  private List<MapView> getMapViews() {
    List<MapView> mapViews = restClient.givenDefaultUser()
        .queryParam("sort", "sourceIndex")
        .queryParam("size", 100)
        .get("/mapView/" + mapId).then().statusCode(200)
        .extract().jsonPath().getList("content", MapView.class);
    return mapViews;
  }


  @Test
  public void shouldChangeRelationshipForMap() throws Exception {
    MappingDto nomapDto = MappingDto.builder().relationship(MappingRelationship.TARGET_NARROWER).build();
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/map/" + mapId, nomapDto, 35, 9);
    checkRelationships(
        getMapViews().stream().filter(mv -> mv.getTargetId() != null && mv.getSourceIndex() != 11)
            .collect(Collectors.toList()),
        MappingRelationship.TARGET_NARROWER);
  }


  @Test
  public void shouldChangeRelationshipForTask() throws Exception {
    MappingDto nomapDto = MappingDto.builder().relationship(MappingRelationship.TARGET_NARROWER).build();
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping/task/" + taskId, nomapDto, 18, 6);
  }


  @Test
  public void shouldChangeRelationshipForSelected() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    mapViews.stream()
        .filter(mapView -> mapView.getTargetId() != null)
        .collect(Collectors.toList())
        .forEach(mapView -> {
          MappingDto nomapDto = MappingDto.builder().relationship(MappingRelationship.TARGET_NARROWER).targetId(mapView.getTargetId())
              .build();
          mappingDetails.add(MappingDetails.builder().rowId(mapView.getRowId()).mappingUpdate(nomapDto).build());
        });
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMapping", mappingUpdate, 10, 9);
  }


  @Test
  public void failChangeWithNoChangesSpecified() throws Exception {
    String expectedDetail = "No changes were specified";
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    expectFail("/updateMapping", mappingUpdate, 400, expectedDetail);
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail("/updateMapping", mappingUpdate, 400, expectedDetail);

    MappingDto mappingDto = MappingDto.builder().build();
    expectFail("/updateMapping/map/" + mapId, mappingDto, 400, expectedDetail);
    expectFail("/updateMapping/task/" + taskId, mappingDto, 400, expectedDetail);
  }


  @Test
  public void failDifferentTaskAcrossBulkChange() throws Exception {
    MappingDto nomapDto = MappingDto.builder().status(MapStatus.REJECTED).build();
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(1).getRowId()).taskId(taskId).mappingUpdate(nomapDto).build());
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(3).getRowId()).taskId(task2Id).mappingUpdate(nomapDto).build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail("/updateMapping", mappingUpdate, 400,
        "Specified task identifiers for bulk changes must be the same value");
  }


  @Test
  public void failDifferentTaskForDifferentUser() throws Exception {
    MappingDto nomapDto = MappingDto.builder().status(MapStatus.REJECTED).build();
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(22).getRowId()).taskId(task2Id).mappingUpdate(nomapDto).build());
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(23).getRowId()).taskId(task2Id).mappingUpdate(nomapDto).build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail("/updateMapping", mappingUpdate, 403, "User is not assigned to task " + task2Id);
  }


  @Test
  public void failTaskDoesNotMatchRow() throws Exception {
    MappingDto nomapDto = MappingDto.builder().status(MapStatus.REJECTED).build();
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(22).getRowId()).taskId(taskId).mappingUpdate(nomapDto).build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail("/updateMapping", mappingUpdate, 400,
        "Specified task " + taskId + " is not associated with map row " + mapViews.get(22).getRowId());
  }


  @Test
  public void failTargetAndRowDoNotMatch() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    MappingDto nomapDto = MappingDto.builder().relationship(MappingRelationship.TARGET_NARROWER).targetId(mapViews.get(5).getTargetId())
        .build();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(1).getRowId()).taskId(taskId).mappingUpdate(nomapDto).build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail("/updateMapping", mappingUpdate, 400,
        "Map row target " + mapViews.get(5).getTargetId() + " does not belong to map row " + mapViews.get(1).getRowId());
  }


  @Test
  public void failChangeNoTaskNotOwner() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    mapViews.stream()
        .filter(mapView -> mapView.getTargetId() != null)
        .collect(Collectors.toList())
        .forEach(mapView -> {
          MappingDto nomapDto = MappingDto.builder().clearTarget(true).targetId(mapView.getTargetId()).build();
          mappingDetails.add(MappingDetails.builder().rowId(mapView.getRowId()).mappingUpdate(nomapDto).build());
        });
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail(user, "/updateMapping", mappingUpdate, 403, "User is not authorised to update the mapping",
        "Only an owner can perform bulk updates outside of the context of a task");
  }


  @Test
  public void failChangeStatusToUnmapped() throws Exception {
    String expectedDetail = "Cannot set status to UNMAPPED, UNMAPPED is a system controlled state when a row has no targets and no map is not set";
    MappingDto mappingDto = MappingDto.builder().status(MapStatus.UNMAPPED).build();

    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    List<MapView> mapViews = getMapViews();
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(1).getRowId()).taskId(taskId)
        .mappingUpdate(mappingDto).build());
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail("/updateMapping", mappingUpdate, 400, expectedDetail);

    expectFail("/updateMapping/map/" + mapId, mappingDto, 400, expectedDetail);
    expectFail("/updateMapping/task/" + taskId, mappingDto, 400, expectedDetail);
  }


  @Test
  public void failReviewTaskUpdateOtherThanStatus() throws Exception {
    MappingDto mappingDto = MappingDto.builder().noMap(true).build();

    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    List<MapView> mapViews = getMapViews();
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(22).getRowId()).taskId(task2Id)
        .mappingUpdate(mappingDto).build());
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(user, "/updateMapping", mappingUpdate, 1, 0);
    checkRowCounts(user, "/updateMapping/task/" + task2Id, mappingDto, 5, 0);

    mappingDto = MappingDto.builder().clearTarget(true).build();
    mappingDetails = new ArrayList<MappingDetails>();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(22).getRowId()).taskId(task2Id)
        .mappingUpdate(mappingDto).build());
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(user, "/updateMapping", mappingUpdate, 1, 0);
    checkRowCounts(user, "/updateMapping/task/" + task2Id, mappingDto, 5, 0);

    mappingDto = MappingDto.builder().relationship(MappingRelationship.TARGET_NARROWER).build();
    mappingDetails = new ArrayList<MappingDetails>();
    mappingDetails.add(MappingDetails.builder().rowId(mapViews.get(22).getRowId()).taskId(task2Id)
        .mappingUpdate(mappingDto).build());
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(user, "/updateMapping", mappingUpdate, 1, 0);
    checkRowCounts(user, "/updateMapping/task/" + task2Id, mappingDto, 5, 0);
  }


  @Test
  public void failNoMapAndStatusChangeSelectedRowsViaSelection() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    MappingDto nomapDto = MappingDto.builder().noMap(true).status(MapStatus.UNMAPPED).build();
    List<MapView> mapViews = getMapViews();
    mappingDetails.add(MappingDetails.builder().selection(Arrays.asList(
            MappedRowDetailsDto.builder().mapRowId(mapViews.get(0).getRowId()).build(),
            MappedRowDetailsDto.builder().mapRowId(mapViews.get(1).getRowId()).build()
        ))
        .taskId(taskId)
        .mappingUpdate(nomapDto)
        .build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    expectFail("/updateMappingForSelected", mappingUpdate, 400,
        "Invalid combination of changes. Clear/set 'no map' and clearing targets must be done independently of any other changes");
  }


  @Test
  public void shouldBulkNoMapSelectedRowsViaSelection() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    MappingDto nomapDto = MappingDto.builder().noMap(true).build();
    List<MapView> mapViews = getMapViews();
    mappingDetails.add(MappingDetails.builder().selection(Arrays.asList(
            MappedRowDetailsDto.builder().mapRowId(mapViews.get(0).getRowId()).build(),
            MappedRowDetailsDto.builder().mapRowId(mapViews.get(11).getRowId()).build()
        ))
        .taskId(taskId)
        .mappingUpdate(nomapDto)
        .build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMappingForSelected", mappingUpdate, 2, 1);
  }


  @Test
  public void shouldBulkChangeStatusSelectedViaSelection() throws Exception {
    MappingDto nomapDto = MappingDto.builder().status(MapStatus.DRAFT).build();
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    mappingDetails.add(MappingDetails.builder().selection(Arrays.asList(
            MappedRowDetailsDto.builder().mapRowId(mapViews.get(1).getRowId()).build(),
            MappedRowDetailsDto.builder().mapRowId(mapViews.get(3).getRowId()).build()
        ))
        .taskId(taskId)
        .mappingUpdate(nomapDto)
        .build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMappingForSelected", mappingUpdate, 2, 1);
  }


  @Test
  public void shouldClearTargetsSelectedViaSelection() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    List<MappedRowDetailsDto> selections = new ArrayList<MappedRowDetailsDto>();
    MappingDto nomapDto = MappingDto.builder().clearTarget(true).build();
    mapViews.stream()
        .filter(mapView -> mapView.getTargetId() != null)
        .collect(Collectors.toList())
        .forEach(mapView -> {
          selections.add(MappedRowDetailsDto.builder().mapRowId(mapView.getRowId()).mapRowTargetId(mapView.getTargetId()).build());
        });
    mappingDetails.add(MappingDetails.builder()
        .selection(selections)
        .mappingUpdate(nomapDto)
        .build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMappingForSelected", mappingUpdate, 10, 9);
  }


  @Test
  public void shouldChangeRelationshipForSelectedViaSelection() throws Exception {
    List<MappingDetails> mappingDetails = new ArrayList<MappingDetails>();
    List<MapView> mapViews = getMapViews();
    List<MappedRowDetailsDto> selections = new ArrayList<MappedRowDetailsDto>();
    MappingDto nomapDto = MappingDto.builder().relationship(MappingRelationship.TARGET_NARROWER).build();
    mapViews.stream()
        .filter(mapView -> mapView.getTargetId() != null)
        .collect(Collectors.toList())
        .forEach(mapView -> {
          selections.add(MappedRowDetailsDto.builder().mapRowId(mapView.getRowId()).mapRowTargetId(mapView.getTargetId()).build());
        });
    mappingDetails.add(MappingDetails.builder()
        .selection(selections)
        .mappingUpdate(nomapDto)
        .build());
    MappingUpdateDto mappingUpdate = new MappingUpdateDto();
    mappingUpdate.setMappingDetails(mappingDetails);
    checkRowCounts(DEFAULT_TEST_USER_SUBJECT, "/updateMappingForSelected", mappingUpdate, 10, 9);
  }

  @Test
  public void shouldCreateNewMappingVersionDifferentSource() throws Exception {

    restClient.validateMapTargets(mapId);

    List<MapViewDto> originalMap = getMapViewDtoList(mapId);

    Set<Integer> codesToOmit = Set.of(10, 15, 16, 17);
    Long newCodesetId = restClient.createImportedCodeSet("map row code", "new display", "test code set", "1.2.3", 40, codesToOmit);

    java.util.Map<String, Object> map = new HashMap<>();
    map.put("mapVersion", "new-map-version-new-source");
    map.put("toVersion", "http://snomed.info/sct/32506021000036107/version/20210231");
    map.put("toScope", "*");
    map.put("sourceId", newCodesetId);

    Long newMapId = restClient.givenDefaultUser().body(objectMapper.writeValueAsString(map))
        .post("/map/" + mapId + "/newMappingVersion")
        .then().statusCode(200).extract().body().as(Long.class);

    restClient.givenDefaultUser()
        .get("/maps/" + newMapId)
        .then().statusCode(200)
        .body("mapVersion", is("new-map-version-new-source"))
        .body("toVersion", is("http://snomed.info/sct/32506021000036107/version/20210231"))
        .body("toScope", is("*"));

    List<MapViewDto> originalMap2 = getMapViewDtoList(mapId);

    assertEquals(Set.copyOf(originalMap), Set.copyOf(originalMap2), "Original map is unchanged by being cloned");

    List<MapViewDto> newMap = getMapViewDtoList(newMapId);

    Map<String, List<MapViewDto>> originalMapViewCache = cacheMapViewBySourceCode(originalMap);
    Map<String, List<MapViewDto>> newMapViewCache = cacheMapViewBySourceCode(newMap);

    for (int i = 1; i <= 40; i++) {
      String code = "map row code " + i + ".";
      if (codesToOmit.contains(i)) {
        assertFalse(newMapViewCache.containsKey(code));
      } else if (i > 34) { // original code set size
        assertTrue(newMapViewCache.containsKey(code));
        assertFalse(originalMapViewCache.containsKey(code));

        List<MapViewDto> newMapViews = newMapViewCache.get(code);

        for (MapViewDto dto : newMapViews) {
          assertNotNull(dto.rowId);
          assertNotNull(dto.sourceIndex);
          assertEquals(dto.sourceCode, code);
          assertEquals(dto.sourceDisplay, "new display " + i);
          assertFalse(dto.noMap);
          assertNull(dto.targetId);
          assertNull(dto.targetCode);
          assertNull(dto.targetDisplay);
          assertNull(dto.relationship);
          assertEquals(dto.status, MapStatus.UNMAPPED);
          assertNull(dto.latestNote);
          assertNull(dto.assignedAuthor);
          assertNull(dto.assignedReviewer);
          assertNull(dto.lastAuthor);
          assertNull(dto.lastReviewer);
          assertFalse(dto.containsTargetTag(TARGET_OUT_OF_SCOPE_TAG));
        }
      } else {
        List<MapViewDto> originalMapViews = originalMapViewCache.get(code);
        List<MapViewDto> newMapViews = newMapViewCache.get(code);

        for (int j = 0; j < originalMapViews.size(); j++) {
          compareClonedMapRow(i, "map row display", "new display", originalMapViews.get(j), newMapViews.get(j), false);
        }
      }
    }
  }

  private List<MapViewDto> getMapViewDtoList(Long mapId) {
    RequestSpecification request = restClient.givenDefaultUser()
        .queryParam("size", 100);
    return request.get("/mapView/" + mapId)
        .then().statusCode(200).extract().body().jsonPath().getList("content", MapViewDto.class);
  }

  private Map<String, List<MapViewDto>> cacheMapViewBySourceCode(List<MapViewDto> dtos) {
    java.util.Map<String, List<MapViewDto>> map = new HashMap<>();
    for (MapViewDto dto : dtos) {
      List<MapViewDto> list = map.get(dto.getSourceCode());
      if (list == null) {
        list = new ArrayList<>();
      }
      list.add(dto);

      list.sort(new Comparator<MapViewDto>() {
        @Override
        public int compare(MapViewDto o1, MapViewDto o2) {
          return new CompareToBuilder()
              .append(o1.getSourceIndex(), o2.getSourceIndex())
              .append(o1.getSourceCode(), o2.getSourceCode())
              .append(o1.getTargetCode(), o2.getTargetCode())
              .toComparison();
        }
      });
      map.put(dto.getSourceCode(), list);
    }
    return map;
  }

  @Test
  public void shouldCreateNewMappingVersionSameSource() throws Exception {

    restClient.validateMapTargets(mapId);

    List<MapViewDto> originalMap = getMapViewDtoList(mapId);

    java.util.Map<String, Object> map = new HashMap<>();
    map.put("mapVersion", "new-map-version-same-source");
    map.put("toVersion", "http://snomed.info/sct/32506021000036107/version/20210731");
    map.put("toScope", "*");
    map.put("sourceId", codesetId);

    Long newMapId = restClient.givenDefaultUser().body(objectMapper.writeValueAsString(map))
        .post("/map/" + mapId + "/newMappingVersion")
        .then().statusCode(200).extract().body().as(Long.class);

    restClient.givenDefaultUser()
        .get("/maps/" + newMapId)
        .then().statusCode(200)
        .body("mapVersion", is("new-map-version-same-source"))
        .body("toVersion", is("http://snomed.info/sct/32506021000036107/version/20210731"))
        .body("toScope", is("*"));

    List<MapViewDto> originalMap2 = getMapViewDtoList(mapId);

    assertEquals(Set.copyOf(originalMap), Set.copyOf(originalMap2), "Original map is unchanged by being cloned");

    List<MapViewDto> newMap = getMapViewDtoList(newMapId);
    Map<String, List<MapViewDto>> originalMapViewCache = cacheMapViewBySourceCode(originalMap);
    Map<String, List<MapViewDto>> newMapViewCache = cacheMapViewBySourceCode(newMap);

    for (int i = 1; i <= 34; i++) {
      String code = "map row code " + i + ".";
      List<MapViewDto> originalMapViews = originalMapViewCache.get(code);
      List<MapViewDto> newMapViews = newMapViewCache.get(code);

      for (int j = 0; j < originalMapViews.size(); j++) {
        compareClonedMapRow(i, "map row display", "map row display", originalMapViews.get(j),
            newMapViews.get(j), true);
      }
    }

    boolean originalHasFlagged = false;
    boolean originalHasTargets = false;
    boolean originalHasNote = false;
    boolean originalHasAssignedAuthor = false;
    boolean originalHasAssignedReviewer = false;
    for (int i = 0; i < originalMap.size(); i++) {
      MapViewDto originalRow = originalMap.get(i);
      MapViewDto newRow = newMap.get(i);

      if (originalRow.containsTargetTag(TARGET_OUT_OF_SCOPE_TAG)) {
        originalHasFlagged = true;
      }

      if (originalRow.latestNote != null) {
        originalHasNote = true;
      }

      if (originalRow.assignedAuthor != null) {
        originalHasAssignedAuthor = true;
      }

      if (originalRow.assignedReviewer != null) {
        originalHasAssignedReviewer = true;
      }

      if (originalRow.targetId != null) {
        originalHasTargets = true;
      }

    }

    assertTrue(originalHasFlagged);
    assertTrue(originalHasTargets);
    assertTrue(originalHasNote);
    assertTrue(originalHasAssignedAuthor);
    assertTrue(originalHasAssignedReviewer);

  }

  private void compareClonedMapRow(int i, String originalDisplay, String newDisplay, MapViewDto originalRow, MapViewDto newRow,
      boolean expectEqualIndexes) {
    assertNotEquals(originalRow.rowId, newRow.rowId, "Row id should not be equal - row " + i);
    if (expectEqualIndexes) {
      assertEquals(originalRow.sourceIndex, newRow.sourceIndex, "Source id should be equal - row " + i);
    }
    assertEquals(originalRow.sourceCode, newRow.sourceCode, "Source code should match - row " + i);
    assertEquals(originalRow.sourceDisplay, originalDisplay + " " + i, "Original source display - row " + i);
    assertEquals(newRow.sourceDisplay, newDisplay + " " + i, "New source display - row " + i);
    assertEquals(originalRow.noMap, newRow.noMap, "No map should be equal - row " + i);
    if (originalRow.targetId != null) {
      assertNotEquals(originalRow.targetId, newRow.targetId, "Target id should not be equal - row " + i);
    }
    assertEquals(originalRow.targetCode, newRow.targetCode, "Target code should be equal - row " + i);
    assertEquals(originalRow.targetDisplay, newRow.targetDisplay, "Target display should be equal - row " + i);
    assertEquals(originalRow.relationship, newRow.relationship, "Relationship should be equal - row " + i);
    assertEquals(originalRow.status, newRow.status, "Status should be equal - row " + i);
    assertNull(newRow.latestNote, "Latest note should not exist - row " + i);
    assertNull(newRow.assignedAuthor, "Should be no assigned author - row " + i);
    assertNull(newRow.assignedReviewer, "Should ne no assigned reviewer - row " + i);
    assertEquals(originalRow.lastAuthor, newRow.lastAuthor, "Last author be equal - row " + i);
    assertEquals(originalRow.lastReviewer, newRow.lastReviewer, "Last reviewer be equal - row " + i);
    boolean expectToBeFlagged = newRow.targetCode != null && !newRow.targetCode.trim().isEmpty() &&
            !isValidSctId(newRow.targetCode, RF2SchemaConstants.PartionIdentifier.CONCEPT);
    assertEquals(expectToBeFlagged, newRow.containsTargetTag(TARGET_OUT_OF_SCOPE_TAG),
        "Flagged should be " + expectToBeFlagged + " - row " + i);
  }

  @Test
  public void failCreateNewMappingVersionNotProjectOwner() throws Exception {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("mapVersion", mapVersion + "new");
    map.put("toVersion", "http://snomed.info/sct/32506021000036107/version/20210531");
    map.put("toScope", "http://map.test.toscope");
    map.put("sourceId", codesetId);

    restClient.givenUser(user).body(objectMapper.writeValueAsString(map))
        .post("/map/" + mapId + "/newMappingVersion")
        .then().statusCode(403);
  }

  @Test
  public void failCreateNewMappingVersionNoSuchImportedCodeSet() throws Exception {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("mapVersion", mapVersion);
    map.put("toVersion", "http://snomed.info/sct/32506021000036107/version/20210531");
    map.put("toScope", "http://map.test.toscope");
    map.put("sourceId", 99999);

    restClient.givenDefaultUser().body(objectMapper.writeValueAsString(map))
        .post("/map/" + mapId + "/newMappingVersion")
        .then().statusCode(404)
        .body("detail", is("No ImportedSourceCode found with id 99999"));
  }

  @Test
  public void failCreateNewMappingVersionNoExistingMap() throws Exception {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("mapVersion", mapVersion);
    map.put("toVersion", "http://snomed.info/sct/32506021000036107/version/20210531");
    map.put("toScope", "http://map.test.toscope");
    map.put("sourceId", codesetId);

    // perhaps counterintuitive, but if the map doesn't exist you don't have permissions for it
    restClient.givenDefaultUser().body(objectMapper.writeValueAsString(map))
        .post("/map/" + 999999999 + "/newMappingVersion")
        .then().statusCode(403);
  }

  @Test
  public void failCreateNewMappingVersionInvalidMap() throws Exception {
    java.util.Map<String, Object> map = new HashMap<>();
    map.put("mapVersion", mapVersion);
    map.put("toVersion", "http://snomed.info/sct/32506021000036107/version/20210531");
    map.put("toScope", "http://map.test.toscope");
    map.put("sourceId", codesetId);

    restClient.givenDefaultUser().body(objectMapper.writeValueAsString(map))
        .post("/map/" + mapId + "/newMappingVersion")
        .then().statusCode(400)
        .body("type", is("http://snap2snomed.app/problem/new-map-version/duplicate-version"))
        .body("title", is("Map already exists with specified version"));
  }

  private void checkRowCounts(String user, String url, Object mappingUpdate, int valueMax, int valueCount) throws Exception {
    restClient.givenUser(user)
        .body(objectMapper.writeValueAsString(mappingUpdate))
        .post(url)
        .then().statusCode(200)
        .contentType("application/json").log().body()
        .body("rowCount", is(valueMax))
        .body("updatedRowCount", is(valueCount));
  }

  private void expectFail(String user, String url, Object dto, int statusCode, String title, String detail)
      throws Exception {

    ValidatableResponse response = restClient.givenUser(user)
        .body(objectMapper.writeValueAsString(dto))
        .post(url)
        .then().statusCode(statusCode);

    if (detail != null) {
      response.body("detail", is(detail));
    }

    if (title != null) {
      response.body("title", is(title));
    }
  }

  private void expectFail(String url, Object dto, int statusCode, String detail) throws Exception {
    expectFail(DEFAULT_TEST_USER_SUBJECT, url, dto, statusCode, null, detail);
  }

  private void checkRelationships(List<MapView> mapViews, MappingRelationship relationship) {
    mapViews.stream()
        .forEach(mapView -> {
          assertEquals(relationship, mapView.getRelationship());
          assertEquals(MapStatus.DRAFT, mapView.getStatus());
        });
  }

  @Data
  static class MapViewDto {

    private Long rowId;

    private Long sourceIndex;

    private String sourceCode;

    private String sourceDisplay;

    private Boolean noMap;

    private Long targetId;

    private String targetCode;

    private String targetDisplay;

    private MappingRelationship relationship;

    private MapStatus status;

    private Instant latestNote;

    private List<UserDto> assignedAuthor;

    private UserDto assignedReviewer;

    private UserDto lastAuthor;

    private UserDto lastReviewer;

    private boolean flagged;

    private Set<String> targetTags;

    public boolean containsTargetTag(String tag) {
      return targetTags != null && targetTags.contains(tag);
    }
  }

  @Data
  static class UserDto {

    private Instant created;

    private Instant modified;

    private String createdBy;

    private String modifiedBy;

    private String id;

    private String givenName;

    private String familyName;

    private String nickname;

    private String email;

    private String fullName;
  }
}
