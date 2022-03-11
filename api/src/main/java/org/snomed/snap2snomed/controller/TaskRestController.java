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
import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.snomed.snap2snomed.controller.dto.AutomapRowDto;
import org.snomed.snap2snomed.controller.dto.IndexSpecification;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.problem.task.TaskDeletProblem;
import org.snomed.snap2snomed.repository.ImportedCodeRepository;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.snomed.snap2snomed.repository.TaskRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.security.WebSecurity;
import org.snomed.snap2snomed.util.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

@RestController
public class TaskRestController {

  @Autowired
  private TaskRepository taskRepository;

  @Autowired
  private MapRowRepository mapRowRepository;

  @Autowired
  private ImportedCodeRepository importedCodeRepository;

  @Autowired
  private AuthenticationFacade authenticationFacade;

  @Autowired
  WebSecurity webSecurity;    

  @Operation(description = "Returns flattened set of MapRow id, sourceDisplay pairs for automapping")
  @GetMapping(path = "/task/{id}/automapRows", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Collection<AutomapRowDto>> getMapView(@PathVariable(required = true) Long id) {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
 
    if (!webSecurity.isAdminUser() && !webSecurity.isTaskAssignee(id)) {
      throw new NotAuthorisedProblem("Not authorised to automap, user is not admin or assignee for the task!");
    }
    final List<AutomapRowDto> results = new ArrayList<>();

    return ResponseEntity.ok(mapRowRepository.findUnmappedAuthorTaskRows(id));
  }

  @Transactional
  @RequestMapping(method = RequestMethod.POST, value = "/task/{taskId}/$complete")
  public void completeTask(@PathVariable Long taskId) {
    Task task = taskRepository.findById(taskId).orElseThrow();
    Boolean isAdmin = authenticationFacade.isAdminUser();
    boolean isAssignee = EntityUtils.isTaskAssignee(authenticationFacade.getAuthenticatedUser(), task);

    if (!isAdmin && !isAssignee) {
      throw new TaskDeletProblem("only-owners-and-assignees", "Only owners and assignees may delete tasks", Status.FORBIDDEN);
    } else {
      IndexSpecification incompleteRows = getIncompleteRows(task);
      if (!isAdmin && incompleteRows.getCount() != 0) {
        throw new TaskDeletProblem("incomplete-rows-for-task",
          "The task cannot be completed because there are " + incompleteRows.getCount() + " rows still not in a complete state which are "
              + incompleteRows.getSpecification(), Status.BAD_REQUEST);
      }
    }

    String principalSubject = authenticationFacade.getPrincipalSubject();
    Instant modified = Instant.now();
    if (task.getType().equals(TaskType.AUTHOR)) {
      mapRowRepository.setAuthorTaskToNull(task, modified, principalSubject);
    } else {
      mapRowRepository.setReviewTaskToNull(task, modified, principalSubject);
    }
    taskRepository.delete(task);
  }

  @RequestMapping(method = RequestMethod.GET, value = "/task/{taskId}/$countIncompleteRows")
  public IndexSpecification countIncompleteRows(@PathVariable Long taskId) {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForTaskId(taskId)) {
      throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project for the task!");
    }
    if (taskRepository.existsById(taskId)) {
      Task task = taskRepository.findById(taskId).orElseThrow(() -> Problem.valueOf(Status.BAD_REQUEST, "Cannot find task with id " + taskId));
      return getIncompleteRows(task);
    } else {
      throw Problem.builder().withStatus(Status.NOT_FOUND).withDetail("Task " + taskId + " could not be found.").withTitle("Task not found").withType(
          URI.create(Snap2SnomedProblem.BASE_PROBLEM_TYPE_URI + "task/not-found")).build();
    }
  }

  private IndexSpecification getIncompleteRows(Task task) {
    List<MapStatus> statuses;
    if (task.getType().equals(TaskType.AUTHOR)) {
      statuses = MapStatus.getCompletedAuthorStatuses();
    } else if (task.getType().equals(TaskType.REVIEW)) {
      statuses = MapStatus.getCompletedReviewStatuses();
    } else {
      throw new IllegalArgumentException("Unexpected task type " + task.getType());
    }

    List<Long> rows = mapRowRepository.getSourceRowIndexesForTaskNotInState(task, statuses);
    Long largestSourceIndexForCodeSet = importedCodeRepository.findLargestSourceIndexForCodeSet(task.getMap().getSource());
    return IndexSpecification.of(rows, largestSourceIndexForCodeSet);
  }
}

