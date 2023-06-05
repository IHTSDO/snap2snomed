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

import java.util.Collections;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.snomed.snap2snomed.model.*;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.problem.mapping.InvalidMappingProblem;
import org.snomed.snap2snomed.problem.mapping.UnauthorisedMappingProblem;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.snomed.snap2snomed.repository.MapRowTargetRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.util.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkSave;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

@RepositoryEventHandler
@Slf4j
public class MapRowEventHandler {

  @Autowired
  MapRowRepository mapRowRepository;

  @Autowired
  MapRowTargetRepository mapRowTargetRepository;

  @Autowired
  AuthenticationFacade authenticationFacade;

  @PersistenceContext
  private EntityManager em;

  @HandleBeforeCreate
  public void handleMapRowBeforeCreate(MapRow mapRow) {
    throw Problem.valueOf(Status.FORBIDDEN, "Map rows are system created on creation of a map");
  }

  @HandleBeforeSave
  public void handleMapRowBeforeSave(MapRow mapRow) {
    if (mapRow.getId() != null) {
      em.detach(mapRow);
      validateRequestedChange(mapRow, authenticationFacade.getAuthenticatedUser(), mapRowRepository.findById(mapRow.getId()).orElseThrow());
      em.merge(mapRow);
    }

    performAutomaticUpdates(mapRow);
  }

  @HandleBeforeLinkSave
  public void handleBeforeLinkSave(MapRow mapRow) {
    throw new NotAuthorisedProblem("Map row links cannot be modified");
  }

  @HandleBeforeLinkDelete
  public void handleBeforeLinkDelete(MapRow mapRow) {
    throw new NotAuthorisedProblem("Map row links cannot be modified");
  }

  /**
   * This method updates aspects of the MapRow that are automatically handled - last author/reviewer and no map
   *
   * @param mapRow
   */
  public void performAutomaticUpdates(MapRow mapRow) {
    updateLastAuthorOrReviewed(mapRow);

    if (mapRow.isNoMap() && !mapRow.isNoMapPrevious()) {
      log.debug("noMap has been change to true, removing dangling MapRowTargets");
      // Clean up MapRowTargets if and only if noMap is true and was previously false
      mapRowTargetRepository.deleteAllByRow(mapRow);

    }
    mapRow.setNoMapPrevious(mapRow.isNoMap());

    if (mapRow.getMap().getProject().getDualMapMode()) {
      MapRow siblingMapRow = mapRowRepository.findDualMapSiblingRow(mapRow.getMap().getId(), mapRow.getSourceCode().getId(), mapRow.getId());
      // 1. check if both dual map rows have been mapped
      if (mapRow.getStatus() == MapStatus.MAPPED && siblingMapRow.getStatus() == MapStatus.MAPPED) {

        // 2. check if both dual map rows agree
        if (isEquivalentTarget(mapRow, siblingMapRow)) {
          // TODO determine equality over multiple rows
          mapRow.setAuthorTask(null);
          mapRow.setBlindMapFlag(Boolean.FALSE);
          mapRowRepository.deleteById(siblingMapRow.getId());
          mapRowRepository.save(mapRow);
          siblingMapRow = null;
        }
        else {
          // 3b. Put the dual map rows into the reconcile state
          mapRow.setStatus(MapStatus.RECONCILE);
          mapRow.setAuthorTask(null);
          mapRow.setBlindMapFlag(Boolean.FALSE);
          siblingMapRow.setStatus(MapStatus.RECONCILE);
          siblingMapRow.setAuthorTask(null);
          siblingMapRow.setBlindMapFlag(Boolean.FALSE);
          mapRowRepository.save(mapRow);
          mapRowRepository.save(siblingMapRow);
        }

        // TODO check if author task no longer has any tasks and delete the task - ML said framework should take care of this
      }
    }
  }

  /*
   * A target is considered equal if the targetCode, relationship, noMap, and status match
   */
  private boolean isEquivalentTarget(MapRow mapRow1, MapRow mapRow2) {

    if (mapRow1.isNoMap() != mapRow2.isNoMap()) {
      return false;
    }
    else if (!mapRow1.getStatus().equals(mapRow2.getStatus())) {
      return false;
    }
    else {
      List<MapRowTarget> mapRowTargets1 = mapRow1.getMapRowTargets();
      List<MapRowTarget> mapRowTargets2 = mapRow2.getMapRowTargets();
      if (mapRowTargets1.size() != mapRowTargets2.size()) {
        return false;
      }
      else {
        if (mapRowTargets1.size() > 1) { // size will be identical here, only test one
          Collections.sort(mapRowTargets1);
          Collections.sort(mapRowTargets2);
        }

        for (int i = 0; i < mapRowTargets1.size(); i++) {
          if (!mapRowTargets1.get(i).getTargetCode().equals(mapRowTargets2.get(i).getTargetCode())) {
            return false;
          }
          else if (!mapRowTargets1.get(i).getRelationship().equals(mapRowTargets2.get(i).getRelationship())) {
            return false;
          }
        }

      }
    }

    return true;
  }

  private void validateRequestedChange(MapRow mapRow, User currentUser, MapRow mapRowFromDatabase) {
    if (immutableFieldChanged(mapRow, mapRowFromDatabase)) {
      throw new UnauthorisedMappingProblem("Attempt to change an immutable field");
    }

    boolean author = EntityUtils.isTaskAssignee(currentUser, mapRowFromDatabase.getAuthorTask());
    boolean reviewer = EntityUtils.isTaskAssignee(currentUser, mapRowFromDatabase.getReviewTask());
    MapStatus.Role role = author ? MapStatus.Role.AUTHOR : reviewer ? MapStatus.Role.REVIEWER : null ;

    if (author && reviewer) {
      // state transition will be validated precommit
      validateAuthorChanges(mapRow, mapRowFromDatabase);
    } else if (author || reviewer) {
      if (!mapRowFromDatabase.getStatus().isValidTransitionForRole(mapRow.getStatus(), role)) {
        throw new UnauthorisedMappingProblem(
          role.getName() + " can only change rows that are in a valid " + role.getStateName()
          + " state, this row's state is " + mapRowFromDatabase.getStatus());
      }
      if (author) {
        validateAuthorChanges(mapRow, mapRowFromDatabase);
      } else if (reviewer) {
        if (mapRowFromDatabase.isNoMap() != mapRow.isNoMap()) {
          throw new UnauthorisedMappingProblem("Reviewer cannot change no map status");
        }
      }
    } else {
      throw new UnauthorisedMappingProblem("User is neither author nor reviewer for the requested update");
    }
  }

  private void validateAuthorChanges(MapRow mapRow, MapRow mapRowFromDatabase) {
    if (mapRowFromDatabase.getStatus().equals(MapStatus.REJECTED) && mapRow.getStatus().equals(MapStatus.REJECTED)
        && (mapRow.isNoMap() != mapRowFromDatabase.isNoMap())) {
      throw new UnauthorisedMappingProblem("Author cannot change mapping in the REJECTED state, change to DRAFT first");
    } else if (!MapStatus.UNMAPPED.equals(mapRow.getStatus()) && !mapRow.isNoMap() && mapRow.getMapRowTargets().isEmpty()) {
      throw new InvalidMappingProblem("Cannot change state from UNMAPPED for row with no mappings and 'no map' not set");
    } else if (MapStatus.UNMAPPED.equals(mapRow.getStatus()) && (mapRow.isNoMap() || !mapRow.getMapRowTargets().isEmpty())) {
      throw new InvalidMappingProblem("Cannot change state to UNMAPPED for row with mapping targets or 'no map' set");
    }
  }

  private boolean immutableFieldChanged(MapRow mapRow, MapRow mapRowFromDatabase) {
    return !EntityUtils.areEqual(mapRowFromDatabase.getMap(), mapRow.getMap())
        || !EntityUtils.areEqual(mapRowFromDatabase.getAuthorTask(), mapRow.getAuthorTask())
        || !EntityUtils.areEqual(mapRowFromDatabase.getReviewTask(), mapRow.getReviewTask())
        || !EntityUtils.areEqual(mapRowFromDatabase.getSourceCode(), mapRow.getSourceCode());
  }

  @HandleAfterSave
  public void handleMapRowAfterSave(MapRow mapRow) {
    if (mapRow.getStatus().equals(MapStatus.UNMAPPED)
        && (mapRow.isNoMap() || mapRowTargetRepository.exists(QMapRowTarget.mapRowTarget.row.eq(mapRow)))) {
      mapRow.setStatus(MapStatus.DRAFT);
    }
  }

  @HandleBeforeLinkSave
  @HandleBeforeLinkDelete
  public void handleMapRowTaskLinkBeforeChange(MapRow mapRow, Task task) {
    throw new UnsupportedOperationException("Relationships between rows and tasks must be handed via the task");
  }

  private void updateLastAuthorOrReviewed(MapRow mapRow) {
    if (mapRow.getStatus().isAuthorState()) {
      mapRow.setLastAuthor(authenticationFacade.getAuthenticatedUser());
    } else {
      mapRow.setLastReviewer(authenticationFacade.getAuthenticatedUser());
    }
  }
}
