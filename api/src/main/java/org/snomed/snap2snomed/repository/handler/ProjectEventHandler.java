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

package org.snomed.snap2snomed.repository.handler;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.commons.collections4.SetUtils;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.auth.MissingJwtProblem;
import org.snomed.snap2snomed.problem.auth.MissingJwtSubjectProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.problem.project.CannotDeleteLastOwnerProblem;
import org.snomed.snap2snomed.problem.project.MissingAssignedUserInRoleChangeProblem;
import org.snomed.snap2snomed.problem.project.MultipleProjectRoleProblem;
import org.snomed.snap2snomed.repository.ProjectRepository;
import org.snomed.snap2snomed.repository.UserRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.security.WebSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RepositoryEventHandler
public class ProjectEventHandler {

  @Autowired
  UserRepository userRepository;

  @Autowired
  AuthenticationFacade authenticationFacade;

  @Autowired
  ProjectRepository projectRepository;

  @Autowired
  WebSecurity webSecurity;

  @HandleBeforeCreate
  public void handleProjectBeforeCreate(Project project)
      throws MissingJwtSubjectProblem, MissingJwtProblem {
    // Prevent POST overwriting existing project
    if (project.getId() != null) {
      project.setId(null);
    }

    if (project.getOwners() == null) {
      project.setOwners(new HashSet<>());
    } else {
      project.getOwners().removeIf(o -> o == null);
    }

    User user = authenticationFacade.getAuthenticatedUser();

    if (project.getOwners().stream()
        .noneMatch(o -> null != o.getId() && o.getId().equals(user.getId()))) {
      project.getOwners().add(user);
    }

    checkForUsersInMultipleRoles(project.getOwners(), project.getMembers(), project.getGuests());
  }

  @HandleBeforeSave
  public void handleProjectBeforeSave(Project project)
      throws MissingJwtSubjectProblem, MissingJwtProblem {
    if (!webSecurity.isAdminUser() && !webSecurity.isProjectOwner(project)) {
      throw new NotAuthorisedProblem("Only a project owner can update a project");
    }
    checkAtLeastOneOwner(project.getOwners());
    checkForUsersInMultipleRoles(project.getOwners(), project.getMembers(), project.getGuests());
  }

  @HandleBeforeLinkDelete
  public void handleProjectLinkDelete(Project project, Set<User> link) {
    checkAtLeastOneOwner(project.getOwners());
    checkUsersAssignedToTasks(project);
    if (!webSecurity.isAdminUser() && !webSecurity.isProjectOwner(project)) {
      throw new NotAuthorisedProblem("Only a project owner can update a project");
    }
  }

  @HandleBeforeLinkSave
  public void handleProjectLinkSave(Project project, Set<User> link) {
    checkAtLeastOneOwner(project.getOwners());
    checkForUsersInMultipleRoles(project.getOwners(), project.getMembers(), project.getGuests());
    checkUsersAssignedToTasks(project);
    if (!webSecurity.isAdminUser() && !webSecurity.isProjectOwner(project)) {
      throw new NotAuthorisedProblem("Only a project owner can update a project");
    }
  }

  private void checkUsersAssignedToTasks(Project project) {
    Set<User> assignedUsers = userRepository.findUsersAssignedToTasks(project.getId());
    ProjectEventHandler.checkAssignedUsersStillHaveRole(assignedUsers, project.getOwners(),
        project.getMembers(), project.getGuests());
  }

  public static void checkForUsersInMultipleRoles(Set<User> owners, Set<User> members,
      Set<User> guests) {
    if (owners != null && members != null && SetUtils.intersection(owners, members).size() > 0) {
      User user = SetUtils.intersection(owners, members).stream().findFirst().get();
      throw new MultipleProjectRoleProblem(user, "owner", "member");
    } else if (guests != null && owners != null
        && SetUtils.intersection(owners, guests).size() > 0) {
      User user = SetUtils.intersection(owners, guests).stream().findFirst().get();
      throw new MultipleProjectRoleProblem(user, "owner", "guest");
    } else if (members != null && guests != null
        && SetUtils.intersection(members, guests).size() > 0) {
      User user = SetUtils.intersection(members, guests).stream().findFirst().get();
      throw new MultipleProjectRoleProblem(user, "member", "guest");
    }
  }

  public static void checkAssignedUsersStillHaveRole(Set<User> assignedUsers, Set<User> owners,
      Set<User> members, Set<User> guests) {
    Set<User> users = assignedUsers.stream()
        .filter(u -> !owners.stream().anyMatch(o -> o.getId().equals(u.getId())))
        .filter(u -> members == null || !members.stream().anyMatch(o -> o.getId().equals(u.getId())))
        .filter(u -> guests == null || !guests.stream().anyMatch(o -> o.getId().equals(u.getId())))
        .collect(Collectors.toSet());

    if (users.size() > 0) {
      throw new MissingAssignedUserInRoleChangeProblem(users);
    }
  }

  public static void checkAtLeastOneOwner(Set<User> owners) {
    if (owners.size() < 1) {
      throw new CannotDeleteLastOwnerProblem();
    }
  }
}
