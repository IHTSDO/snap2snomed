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

package org.snomed.snap2snomed.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import java.io.IOException;
import javax.validation.Valid;
import org.snomed.snap2snomed.controller.dto.MapCloneDto;
import org.snomed.snap2snomed.controller.dto.MappingDto;
import org.snomed.snap2snomed.controller.dto.MappingResponse;
import org.snomed.snap2snomed.controller.dto.MappingUpdateDto;
import org.snomed.snap2snomed.controller.dto.ValidationResult;
import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.security.WebSecurity;
import org.snomed.snap2snomed.service.MappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
public class MappingRestController {

  @Autowired
  MappingService mappingService;

  @Autowired
  WebSecurity webSecurity;

  @Operation(description = "Applies a series of bulk changes to a map, each specified by a MappingUpdateDto, "
      + "typically used when a user has manually selected a specific set of rows to modify")
  @Parameter(name = "mappings", in = ParameterIn.QUERY, required = true, allowEmptyValue = false,
      description = "Set of changes to apply including the MapRow/Target identifier and details to change")
  @PostMapping(value = "/updateMapping", consumes = "application/json")
  MappingResponse updateMapping(@RequestBody MappingUpdateDto mappings) {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    // Associated Project role checking happens in the service
    return mappingService.updateMapping(mappings);
  }

  @Operation(description = "Applies a bulk change to a map specified by a MappingDto, "
      + "used when a user has selected the option to bulk change all rows in a map")
  @Parameter(name = "mapId", in = ParameterIn.QUERY, required = true, allowEmptyValue = false,
      description = "Identifier of the map to change")
  @Parameter(name = "mappingUpdates", in = ParameterIn.QUERY, required = true, allowEmptyValue = false,
      description = "Details of the bulk change to make")
  @PostMapping(value = "/updateMapping/map/{mapId}", consumes = "application/json")
  MappingResponse updateMappingForMap(@PathVariable("mapId") Long mapId, @RequestBody MappingDto mappingUpdates) {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!(webSecurity.isAdminUser() || webSecurity.hasAnyProjectRoleForMapId(mapId))) {
      throw new NotAuthorisedProblem("Not authorised to bulk update mapping if the user is not admin or member of an associated project!");
    }
    return mappingService.updateMappingForMap(mapId, mappingUpdates);
  }

  @Operation(description = "Applies a bulk change to a task specified by a MappingDto, "
      + "used when a user has selected the option to bulk change all rows in a task")
  @Parameter(name = "taskId", in = ParameterIn.QUERY, required = true, allowEmptyValue = false,
      description = "Identifier of the task to change")
  @Parameter(name = "mappingUpdates", in = ParameterIn.QUERY, required = true, allowEmptyValue = false,
      description = "Details of the bulk change to make")
  @PostMapping(value = "/updateMapping/task/{taskId}", consumes = "application/json")
  MappingResponse updateMappingForTask(@PathVariable("taskId") Long taskId, @RequestBody MappingDto mappingUpdates) {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!webSecurity.isAdminUser() && !webSecurity.isTaskAssignee(taskId)) {
      throw new NotAuthorisedProblem("Not authorised to bulk update mapping if the user is not admin or not a taask assignee");
    }
    // Associated Project role checking happens in the service
    return mappingService.updateMappingForTask(taskId, mappingUpdates);
  }

  @Operation(description = "Applies a series of bulk changes to a map, each specified by a MappingUpdateDto, "
      + "it is used when a user has manually selected a specific set of rows to modify and provides selection "
      + "in the mapping details with a list of MappedRowDetailsDto")
  @Parameter(name = "mappings", in = ParameterIn.QUERY, required = true, allowEmptyValue = false,
      description = "Set of changes to apply including the MapRow/Target identifier and details to change")
  @PostMapping(value = "/updateMappingForSelected", consumes = "application/json")
  MappingResponse updateMappingForSelection(@RequestBody MappingUpdateDto mappings) {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    // Associated Project role checking happens in the service
    return mappingService.updateMappingForSelection(mappings);
  }

  @Operation(description = "Creates a new Map version by cloning the specified map with specified updates")
  @Parameter(name = "mapId", in = ParameterIn.PATH, required = true, allowEmptyValue = false,
      description = "Identifier of the map to clone")
  @Parameter(name = "mapDetails", required = true, allowEmptyValue = false,
      description = "Details of the new Map version")
  @PostMapping(value = "/map/{mapId}/newMappingVersion", consumes = "application/json")
  Long newMappingForProject(@PathVariable("mapId") Long mapId, @RequestBody @Valid MapCloneDto mapDetails) throws IOException {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!webSecurity.isAdminUser() && !webSecurity.isProjectOwnerForMapId(mapId)) {
      throw new NotAuthorisedProblem("Not authorised to import mapping if the user is not admin or member of an associated project!");
    }
    return mappingService.newMappingVersion(mapId, mapDetails.getSourceId(), mapDetails.getMapVersion(),
        mapDetails.getToVersion(), mapDetails.getToScope());
  }

  @Operation(description = "Validates the target codes for the given map id. " +
          "Where a target code is absent from the particular version of the target codesystem, " +
          "that target row will be flagged.")
  @Parameter(name = "mapId", in = ParameterIn.PATH, required = true, allowEmptyValue = false,
          description = "Identifier of the map to validate")
  @GetMapping(value = "/map/{mapId}/validateTargetCodes")
  ValidationResult validateTargetCodes(@PathVariable("mapId") Long mapId) throws IOException {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!(webSecurity.isAdminUser() || webSecurity.hasAnyProjectRoleForMapId(mapId))) {
      throw new NotAuthorisedProblem("Not authorised to import mapping if the user is not admin or member of an associated project!");
    }    
    return mappingService.validateMapTargets(mapId);
  }
}
