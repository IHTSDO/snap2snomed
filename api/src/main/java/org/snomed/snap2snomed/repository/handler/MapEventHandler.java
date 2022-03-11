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

import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.Note;
import org.snomed.snap2snomed.problem.BadRequestDataProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.repository.ImportedCodeRepository;
import org.snomed.snap2snomed.repository.ImportedCodeSetRepository;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.snomed.snap2snomed.repository.ProjectRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.security.WebSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkSave;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;

@RepositoryEventHandler
@Slf4j
public class MapEventHandler {

  @Autowired
  MapRowRepository mapRowRepository;

  @Autowired
  ImportedCodeSetRepository importedCodeSetRepository;

  @Autowired
  ProjectRepository projectRepository;

  @Autowired
  AuthenticationFacade authenticationFacade;

  @Autowired
  WebSecurity webSecurity;

  @HandleBeforeCreate
  public void handleMapBeforeCreate(Map map) {
    if (map.getProject() == null || map.getProject().getId() == null) {
      throw new BadRequestDataProblem("No project specified to create a map");
    }

    if (map.getSource() == null || map.getSource().getId() == null) {
      throw new BadRequestDataProblem("No code set specified to create a map");
    }

    if (!webSecurity.isProjectOwnerForId(map.getProject().getId()) && !webSecurity.isAdminUser()) {
      throw new NotAuthorisedProblem("Only a project owner can create a map under a project");
    }

    if (!webSecurity.isAuthorisedForImportedCodeSet(map.getSource().getId()) && !webSecurity.isAdminUser()) {
      throw new NotAuthorisedProblem("User is not authorised to create a map using this code set, "
          + "the user must have uploaded the code set or be a member of a project that uses this code set");
    }

  }

  @HandleBeforeSave
  public void handleBeforeSave(Map map) {
    if (map.getProject() == null || map.getProject().getId() == null) {
      throw new BadRequestDataProblem("No project specified to create a map");
    }

    if (!webSecurity.isProjectOwnerForId(map.getProject().getId())) {
      throw new NotAuthorisedProblem("Only a project owner can modify a map");
    }
  }

  @HandleAfterCreate
  public void handleMapAfterCreate(Map map) {
    mapRowRepository.createMapRows(map.getId(), map.getSource().getId(), Instant.now(), authenticationFacade.getPrincipalSubject());
  }


  @HandleBeforeLinkSave
  public void handleBeforeLinkSave(Map map) {
    throw new NotAuthorisedProblem("Note links cannot be modified");
  }

  @HandleBeforeLinkDelete
  public void handleBeforeLinkDelete(Map map) {
    throw new NotAuthorisedProblem("Note links cannot be modified");
  }
}
