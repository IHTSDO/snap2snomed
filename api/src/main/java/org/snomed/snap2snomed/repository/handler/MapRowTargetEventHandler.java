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

import java.util.Set;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.validation.constraints.NotNull;

import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.MapRow;
import org.snomed.snap2snomed.model.MapRowTarget;
import org.snomed.snap2snomed.model.Note;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.QMapRowTarget;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.problem.mapping.UnauthorisedMappingProblem;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.snomed.snap2snomed.repository.MapRowTargetRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.security.WebSecurity;
import org.snomed.snap2snomed.util.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterLinkDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkSave;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;

import lombok.extern.slf4j.Slf4j;

@RepositoryEventHandler
@Slf4j
public class MapRowTargetEventHandler {

  @Autowired
  MapRowTargetRepository mapRowTargetRepository;

  @Autowired
  MapRowRepository mapRowRepository;

  @Autowired
  AuthenticationFacade authenticationFacade;

  @Autowired
  WebSecurity webSecurity;

  @PersistenceContext
  private EntityManager em;

  @HandleBeforeSave
  @HandleBeforeCreate
  public void handleMapRowTargetBeforeSave(MapRowTarget mapRowTarget) {
    if (!isFlagOnlyChange(mapRowTarget) || !isOwner(mapRowTarget)) {
      validateUserRole(mapRowTarget, authenticationFacade.getAuthenticatedUser());
    }

    performAutomaticUpdates(mapRowTarget);
  }

  @HandleBeforeLinkSave
  public void handleBeforeLinkSave(MapRowTarget mapRowTarget) {
    throw new NotAuthorisedProblem("Map row target links cannot be modified");
  }

  @HandleBeforeLinkDelete
  public void handleBeforeLinkDelete(MapRowTarget mapRowTarget) {
    throw new NotAuthorisedProblem("Map row target links cannot be modified");
  }

  private boolean isOwner(MapRowTarget mapRowTarget) {
    final String userId = authenticationFacade.getAuthenticatedUser().getId();

    final MapRow row = mapRowTarget.getRow();
    final Map map = row.getMap();
    final Project project = map.getProject();
    final Set<@NotNull User> owners = project.getOwners();

    return owners.stream().anyMatch(u -> u.getId().equals(userId));
  }

  /**
   * Handles automated changes for map row status change and last author/reviewer update
   *
   * @param mapRowTarget
   */
  public void performAutomaticUpdates(MapRowTarget mapRowTarget) {
    MapRowTarget storedMapRowTarget = null;
    if (mapRowTarget.getId() != null) {
      em.detach(mapRowTarget);
      storedMapRowTarget = mapRowTargetRepository.findById(mapRowTarget.getId()).orElse(null);
      em.merge(mapRowTarget);
    }
    if (storedMapRowTarget == null ||
        !storedMapRowTarget.getRelationship().equals(mapRowTarget.getRelationship())
        || !storedMapRowTarget.getTargetCode().equals(mapRowTarget.getTargetCode())
        || !storedMapRowTarget.getTargetDisplay().equals(mapRowTarget.getTargetDisplay())) {
      // only revert to DRAFT state for a change other than being flagged
      mapRowTarget.getRow().setStatus(MapStatus.DRAFT);
    }
    updateLastAuthorOrReviewed(mapRowTarget, false);
  }

  @HandleBeforeDelete
  public void handleMapRowTargetBeforeDelete(MapRowTarget mapRowTarget) {
    validateUserRole(mapRowTarget, authenticationFacade.getAuthenticatedUser());
    updateLastAuthorOrReviewed(mapRowTarget, true);
  }

  @HandleAfterDelete
  public void handleMapRowTargetAfterDelete(MapRowTarget mapRowTarget) {
    updateMapRowStatusAfterTargetRemoved(mapRowTarget);
  }

  @HandleBeforeLinkSave
  public void handleMapRowTargetBeforeLinkCreate(MapRowTarget mapRowTarget, MapRow row) {
    validateUserRole(mapRowTarget, authenticationFacade.getAuthenticatedUser());
    mapRowTarget.getRow().setStatus(MapStatus.DRAFT);
    updateLastAuthorOrReviewed(mapRowTarget, false);
  }

  @HandleBeforeLinkDelete
  public void handleMapRowTargetBeforeLinkDelete(MapRowTarget mapRowTarget, MapRow row) {
    validateUserRole(mapRowTarget, authenticationFacade.getAuthenticatedUser());
    updateLastAuthorOrReviewed(mapRowTarget, true);
  }

  @HandleAfterLinkDelete
  public void handleMapRowTargetAfterLinkDelete(MapRowTarget mapRowTarget, MapRow row) {
    updateMapRowStatusAfterTargetRemoved(mapRowTarget);
  }

  private void validateUserRole(MapRowTarget mapRowTarget, User currentUser) {
    MapRow mapRow = mapRowRepository.findById(mapRowTarget.getRow().getId()).orElseThrow();
    boolean author = EntityUtils.isTaskAssignee(currentUser, mapRow.getAuthorTask());
    boolean reviewer = EntityUtils.isTaskAssignee(currentUser, mapRow.getReviewTask());

    if (!author && reviewer && (mapRow.getStatus().isAuthorState() || !isFlagOnlyChange(mapRowTarget))) {
      throw new UnauthorisedMappingProblem(
          "A reviewer may only change the flagged attribute of target in a review state, state is " + mapRow.getStatus());
    } else if (!reviewer && author && !(mapRow.getStatus().isAuthorState() || mapRow.getStatus().equals(MapStatus.REJECTED))) {
      throw new UnauthorisedMappingProblem(
          "An author may only change targets for rows in an author state, state is " + mapRow.getStatus());
    } else if (!author && !reviewer) {
      throw new UnauthorisedMappingProblem(
          "User must be a reviewer or an author to create or modify a map row target");
    }
  }

  private boolean isFlagOnlyChange(MapRowTarget mapRowTarget) {
    if (mapRowTarget.getId() != null) {
      em.detach(mapRowTarget);
      MapRowTarget mapRowTargetFromDatabase = mapRowTargetRepository.findById(mapRowTarget.getId()).orElse(null);
      em.merge(mapRowTarget);
      return mapRowTargetFromDatabase != null
          && mapRowTarget.getTargetCode().equals(mapRowTargetFromDatabase.getTargetCode())
          && mapRowTarget.getTargetDisplay().equals(mapRowTargetFromDatabase.getTargetDisplay())
          && mapRowTarget.getRelationship().equals(mapRowTargetFromDatabase.getRelationship());
    }
    return false;
  }

  private void updateMapRowStatusAfterTargetRemoved(MapRowTarget mapRowTarget) {
    MapRow row = mapRowTarget.getRow();
    if (row.getStatus().equals(MapStatus.DRAFT)
        && !row.isNoMap()
        && !mapRowTargetRepository.exists(QMapRowTarget.mapRowTarget.row.eq(row))) {
      row.setStatus(MapStatus.UNMAPPED);
    }
  }

  private void updateLastAuthorOrReviewed(MapRowTarget mapRowTarget, boolean isDelete) {
    MapRow mapRow = mapRowTarget.getRow();

    if (isDelete || mapRow.getStatus().isAuthorState()) {
      mapRow.setLastAuthor(authenticationFacade.getAuthenticatedUser());
    } else {
      mapRow.setLastReviewer(authenticationFacade.getAuthenticatedUser());
    }
  }
}
