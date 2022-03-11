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

package org.snomed.snap2snomed.security;

import java.util.Optional;
import java.util.Set;
import org.snomed.snap2snomed.model.ImportedCode;
import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.repository.ImportedCodeRepository;
import org.snomed.snap2snomed.repository.ImportedCodeSetRepository;
import org.snomed.snap2snomed.repository.MapRepository;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.snomed.snap2snomed.repository.MapRowTargetRepository;
import org.snomed.snap2snomed.repository.ProjectRepository;
import org.snomed.snap2snomed.repository.TaskRepository;
import org.snomed.snap2snomed.repository.UserRepository;
import org.snomed.snap2snomed.util.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class WebSecurity {

  @Autowired
  UserRepository userRepository;

  @Autowired
  TaskRepository taskRepository;

  @Autowired
  MapRepository mapRepository;

  @Autowired
  ProjectRepository projectRepository;

  @Autowired
  MapRowRepository mapRowRepository;

  @Autowired
  MapRowTargetRepository mapRowTargetRepository;

  @Autowired
  ImportedCodeSetRepository importedCodeSetRepository;

  @Autowired
  ImportedCodeRepository importedCodeRepository;

  @Autowired
  AuthenticationFacade authenticationFacade;

  public boolean isValidUser() throws NoSuchUserProblem {
    String subject = getSubjectFromAuthentication();
    if (subject != null && userRepository.existsById(subject)) {
      return true;
    } else {
      throw new NoSuchUserProblem();
    }
  }

  public boolean isProjectOwner(Project assertedProject) {
    return isProjectOwnerForId(assertedProject.getId());
  }

  public boolean isProjectOwnerForId(Long projectId) {
    Project project = projectRepository.findById(projectId).orElse(null);
    return project != null && isInRoles(project.getOwners());
  }

  public boolean hasAnyProjectRole(Project assertedProject) {
    return hasAnyProjectRole(assertedProject.getId());
  }

  public boolean hasAnyProjectRole(Long projectId) {
    return isValidUser() && userRepository.isUserInProject(projectId);
  }

  public boolean isProjectOwnerForMapId(Long mapId) {
    return isValidUser() && userRepository.isUserProjectOwnerForMapId(mapId);
  }

  public boolean hasAnyProjectRoleForMapId(Long mapId) {
    Map map = mapRepository.findById(mapId).orElse(null);
    return map != null && hasAnyProjectRole(map.getProject());
  }

  public boolean hasAnyProjectRoleForMapRowId(Long mapRowId) {
    Project project = projectRepository.findByMapRowId(mapRowId).orElse(null);
    return project != null && hasAnyProjectRole(project);
  }

  public boolean isTaskAssignee(Long taskId) {
    if (!isValidUser()) {
      return false;
    }
    Task task = taskRepository.findById(taskId).orElse(null);
    return EntityUtils.isTaskAssignee(getSubjectFromAuthentication(), task);
  }

  public boolean hasAnyProjectRoleForTaskId(Long taskId) {
    Task task = taskRepository.findById(taskId).orElse(null);
    return task != null && hasAnyProjectRoleForMapId(task.getMap().getId());
  }

  /**
   * isAdminUser - reads token and detects if AdminGroup is set (cognito) - this is also defined in AuthenticationFacade but not able to
   * inject it into this class
   */
  public boolean isAdminUser() {
    return isValidUser() && authenticationFacade.isAdminUser();
  }

  public boolean isAuthorisedForImportedCodeSet(Long codeSetId) {
    return importedCodeSetRepository.findAuthorisedImportedCodeSets().contains(codeSetId);
  }

  public boolean isAuthorisedForImportedCode(Long codeId) {
    ImportedCode code = importedCodeRepository.findById(codeId).orElse(null);
    return code != null && isAuthorisedForImportedCodeSet(code.getImportedCodeSet().getId());
  }

  private boolean isInRoles(Set<User> roles) throws NoSuchUserProblem {
    if (isValidUser()) {
      String subject = getSubjectFromAuthentication();

      Optional<User> maybeUser = userRepository.findById(subject);
      if (maybeUser.isEmpty()) {
        throw new NoSuchUserProblem();
      }
      User user = maybeUser.get();
      return roles != null && roles.contains(user);
    } else {
      return false;
    }
  }

  private String getSubjectFromAuthentication() {
    return authenticationFacade.getPrincipalSubject();
  }

}
