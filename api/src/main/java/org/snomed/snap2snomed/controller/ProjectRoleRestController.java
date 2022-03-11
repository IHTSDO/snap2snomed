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
import java.util.Set;
import org.snomed.snap2snomed.controller.dto.ProjectRoleDto;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.repository.ProjectRepository;
import org.snomed.snap2snomed.repository.UserRepository;
import org.snomed.snap2snomed.repository.handler.ProjectEventHandler;
import org.snomed.snap2snomed.security.WebSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
public class ProjectRoleRestController {

  @Autowired
  private ProjectRepository projectRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private WebSecurity webSecurity;

  @Operation
  @PutMapping(value = "/project/{id}/roles", consumes = "application/json")
  void updateProjectRoles(@PathVariable(required = true) Long id,
      @RequestBody ProjectRoleDto projectRoles) {

    if (!webSecurity.isProjectOwnerForId(id) && !webSecurity.isAdminUser()) {
      throw new NotAuthorisedProblem("Only an owner can change project roles");
    }

    Project project = projectRepository.findById(id).orElseThrow();

    ProjectEventHandler.checkAtLeastOneOwner(project.getOwners());
    ProjectEventHandler.checkForUsersInMultipleRoles(projectRoles.getOwners(),
        projectRoles.getMembers(), projectRoles.getGuests());

    Set<User> assignedUsers = userRepository.findUsersAssignedToTasks(id);
    ProjectEventHandler.checkAssignedUsersStillHaveRole(assignedUsers, projectRoles.getOwners(),
        projectRoles.getMembers(), projectRoles.getGuests());

    project.setOwners(projectRoles.getOwners());
    project.setMembers(projectRoles.getMembers());
    project.setGuests(projectRoles.getGuests());

    projectRepository.save(project);
  }


}
