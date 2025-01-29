/*
 * Copyright © 2022-23 SNOMED International
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
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.SortedSet;
import java.util.TreeSet;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.snomed.snap2snomed.model.*;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.NoteCategory;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.problem.mapping.InvalidMappingProblem;
import org.snomed.snap2snomed.problem.mapping.UnauthorisedMappingProblem;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.snomed.snap2snomed.repository.MapRowTargetRepository;
import org.snomed.snap2snomed.repository.NoteRepository;
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
  NoteRepository noteRepository;

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

    MapStatus originalStatus = mapRow.getStatus();

    updateLastAuthorOrReviewed(mapRow);

    if (mapRow.getMap().getProject().getDualMapMode()) {
  
      MapRow siblingMapRow = mapRowRepository.findDualMapSiblingRow(mapRow.getMap().getId(), mapRow.getSourceCode().getId(), mapRow.getId());

      if (null != siblingMapRow) { 

        // 1. check if both dual map rows have been mapped
        if (mapRow.getStatus() == MapStatus.MAPPED && siblingMapRow.getStatus() == MapStatus.MAPPED) {

          // 2. auto create note documenting those responsible for dual mapping
          //TODO translate note .. maybe this has to be pushed to the ui
          Note author1Note = createNote(mapRow.getAuthorTask().getAssignee().getFullName() + " dual mapped this", 
            mapRow.getModified(), mapRow.getAuthorTask().getAssignee(), mapRow, NoteCategory.STATUS, false);
          Note author2Note = createNote(siblingMapRow.getAuthorTask().getAssignee().getFullName() + " dual mapped this", 
            siblingMapRow.getModified(), siblingMapRow.getAuthorTask().getAssignee(), siblingMapRow, NoteCategory.STATUS, false);
          noteRepository.save(author1Note);
          noteRepository.save(author2Note);

          // 3a. check if both dual map rows agree .. if so resolve into one map row
          if (isEquivalentTarget(mapRow, siblingMapRow)) {
            mapRow.setAuthorTask(null);
            mapRow.setBlindMapFlag(Boolean.FALSE);
            SortedSet<Note> siblingNotes = siblingMapRow.getNotes();
            HashSet<Note> notesCopy = new HashSet<Note>(siblingNotes);  // Create a copy of the original collection to avoid concurrent modification exception
  
            // moving notes preserves the created date
            for (Note note : notesCopy) {
    
              siblingMapRow.getNotes().remove(note);
              //mapRowRepository.save(siblingMapRow);
  
              note.setMapRow(mapRow);
              noteRepository.save(note);
  
              // going to replace mapRow to get a copy with notes, so make sure there aren't any unsaved changes.
              mapRowRepository.save(mapRow);
  
              // prevent a lazy loading error wrt MapRow.getNotes()
              mapRow = this.em.find(MapRow.class, mapRow.getId());
              mapRow.getNotes().add(note);
            }
            // for (Note note : siblingNotes) {
            //   Note newNote = createNote(note.getNoteText(), note.getCreated(), note.getNoteBy(), mapRow, note.getCategory(), note.isDeleted());
            //   noteRepository.save(newNote);
            // }
            mapRowRepository.deleteById(siblingMapRow.getId());
            mapRowRepository.save(mapRow);
            siblingMapRow = null;
          }
          else {
            // 3b. dual map rows don't agree .. put the dual map rows into the reconcile state
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
        else if ((mapRow.getStatus() == MapStatus.MAPPED && siblingMapRow.getStatus() == MapStatus.RECONCILE) ||
            (mapRow.getStatus() == MapStatus.RECONCILE && siblingMapRow.getStatus() == MapStatus.MAPPED)) {

          // Reconciler has fixed the dual map .. merge two rows together

          if (siblingMapRow.isNoMap()) {
            mapRow.setNoMap(true);
          }

          for (MapRowTarget siblingMapRowTarget : siblingMapRow.getMapRowTargets()) {
            MapRowTarget newMapRowTarget = new MapRowTarget(siblingMapRowTarget.getCreated(), siblingMapRowTarget.getModified(), siblingMapRowTarget.getCreatedBy(), 
              siblingMapRowTarget.getModifiedBy(), null, mapRow, siblingMapRowTarget.getTargetCode(), 
              siblingMapRowTarget.getTargetDisplay(), siblingMapRowTarget.getRelationship(), siblingMapRowTarget.getTags(), siblingMapRowTarget.isFlagged(), siblingMapRowTarget.getLastAuthor(), null);
            mapRowTargetRepository.save(newMapRowTarget);
          }

          SortedSet<Note> siblingNotes = siblingMapRow.getNotes();
          HashSet<Note> notesCopy = new HashSet<Note>(siblingNotes);  // Create a copy of the original collection to avoid concurrent modification exception

          // moving notes preserves the created date
          for (Note note : notesCopy) {
  
            siblingMapRow.getNotes().remove(note);
            mapRowRepository.save(siblingMapRow);

            note.setMapRow(mapRow);
            noteRepository.save(note);

            // going to replace mapRow to get a copy with notes, so make sure there aren't any unsaved changes.
            mapRowRepository.save(mapRow);

            // prevent a lazy loading error wrt MapRow.getNotes()
            mapRow = this.em.find(MapRow.class, mapRow.getId());
            mapRow.getNotes().add(note);
          }

          mapRowRepository.save(mapRow);
          mapRowRepository.delete(siblingMapRow);

        }
        else if (originalStatus == MapStatus.RECONCILE && mapRow.getStatus() == MapStatus.RECONCILE && siblingMapRow.getStatus() == MapStatus.RECONCILE && mapRow.isNoMap()) {
          // Remove any targets the sibling row may have if we are in reconcile mode and noMap is 
          // NB had to put the logic here rather than in the if below as we get runtime error messages saying the mapRowTarget cannot be found
          // even though it is there .. this made me move this functionality to the post save handler, however, I've moved it back here as I need
          // to know if we are in a reconcile TASK .. not just in an author task with the row transitioning to RECONCILE when both rows are put into 
          // MAPPED state
          mapRowTargetRepository.deleteAllByRow(siblingMapRow);
        }
      }
    }

    // NB this if logic is not functional, but it seems to work as it would only remove targets if noMap is true and they exist
    if (mapRow.isNoMap() && !mapRow.isNoMapPrevious()) { 
      log.debug("noMap has been change to true, removing dangling MapRowTargets");
      // Clean up MapRowTargets if and only if noMap is true and was previously false
      mapRowTargetRepository.deleteAllByRow(mapRow);
    }
    mapRow.setNoMapPrevious(mapRow.isNoMap());
  }

  private Note createNote(String noteText, Instant createdInstant, User createdByUser, MapRow mapRow, NoteCategory noteCategory, Boolean deleted) {
    Note note = new Note();
    note.setNoteText(noteText);
    note.setCreated(createdInstant);
    note.setCreatedBy(createdByUser.getId());
    note.setNoteBy(createdByUser);
    note.setMapRow(mapRow);
    note.setCategory(noteCategory);
    note.setDeleted(deleted);
    return note;
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
    //todo consider for sibling row .. should be invoked on a change to nomap?
    if (immutableFieldChanged(mapRow, mapRowFromDatabase)) {
      throw new UnauthorisedMappingProblem("Attempt to change an immutable field");
    }

    boolean author = EntityUtils.isTaskAssignee(currentUser, mapRowFromDatabase.getAuthorTask());
    boolean reviewer = EntityUtils.isTaskAssignee(currentUser, mapRowFromDatabase.getReviewTask());
    boolean reconciler = EntityUtils.isTaskAssignee(currentUser, mapRowFromDatabase.getReconcileTask());
    MapStatus.Role authorOrReviewerRole = author ? MapStatus.Role.AUTHOR : reviewer ? MapStatus.Role.REVIEWER : null;
    MapStatus.Role reconcilerRole = reconciler ? MapStatus.Role.RECONCILER : null;

    if (author && reviewer) {
      // state transition will be validated precommit
      validateAuthorChanges(mapRow, mapRowFromDatabase);
    } else if (author || reviewer || reconciler) {
      if (!mapRowFromDatabase.getStatus().isValidTransitionForRole(mapRow.getStatus(), authorOrReviewerRole)) {
        if (null == reconcilerRole) {
          throw new UnauthorisedMappingProblem(
            authorOrReviewerRole.getName() + " can only change rows that are in a valid " + authorOrReviewerRole.getStateName()
            + " state, this row's state is " + mapRowFromDatabase.getStatus());
        }
        else if (!mapRowFromDatabase.getStatus().isValidTransitionForRole(mapRow.getStatus(), reconcilerRole)) {
          throw new UnauthorisedMappingProblem(
            reconcilerRole.getName() + " can only change rows that are in a valid " + reconcilerRole.getStateName()
            + " state, this row's state is " + mapRowFromDatabase.getStatus());
        }
      }
      if (author || reconciler) {
        validateAuthorChanges(mapRow, mapRowFromDatabase);
      } else if (reviewer) {
        if (mapRowFromDatabase.isNoMap() != mapRow.isNoMap()) {
          throw new UnauthorisedMappingProblem("Reviewer cannot change no map status");
        }
      }
    } else {
      throw new UnauthorisedMappingProblem("User is not author / reviewer / reconciler for the requested update");
    }
  }

  private void validateAuthorChanges(MapRow mapRow, MapRow mapRowFromDatabase) {
    if (mapRowFromDatabase.getStatus().equals(MapStatus.REJECTED) && mapRow.getStatus().equals(MapStatus.REJECTED)
        && (mapRow.isNoMap() != mapRowFromDatabase.isNoMap())) {
      throw new UnauthorisedMappingProblem("Author cannot change mapping in the REJECTED state, change to DRAFT first");
    } else if (!MapStatus.UNMAPPED.equals(mapRow.getStatus()) && !MapStatus.RECONCILE.equals(mapRow.getStatus()) && !mapRow.isNoMap() && mapRow.getMapRowTargets().isEmpty()) {
      if (mapRow.getMap().getProject().getDualMapMode()) {
        // target or no map may be on the sibling row
        if (MapStatus.MAPPED.equals(mapRow.getStatus())) {
          MapRow siblingMapRow = mapRowRepository.findDualMapSiblingRow(mapRow.getMap().getId(), mapRow.getSourceCode().getId(), mapRow.getId());
          if (siblingMapRow == null || (siblingMapRow.isNoMap() && siblingMapRow.getMapRowTargets().isEmpty())) {
            throw new InvalidMappingProblem("Cannot change state to MAPPED for dual mapped rows with no mappings and 'no map' not set");
          }
        } 
      }
      else {
        throw new InvalidMappingProblem("Cannot change state from UNMAPPED for row with no mappings and 'no map' not set");
      }
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
    //TODO review for reconcile
    if (mapRow.getStatus().isAuthorState()) {
      mapRow.setLastAuthor(authenticationFacade.getAuthenticatedUser());
    } else {
      mapRow.setLastReviewer(authenticationFacade.getAuthenticatedUser());
    }
  }
}
