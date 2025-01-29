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

 package org.snomed.snap2snomed.model;

 import java.time.Instant;
 import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
 
 import java.util.Set;
 import javax.validation.constraints.NotNull;
 
 import org.snomed.snap2snomed.model.enumeration.MapStatus;
 import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.model.enumeration.NoteCategory;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
 import lombok.Builder;
 import lombok.Data;
 import lombok.NoArgsConstructor;
 
 @Data
 @Builder
 @AllArgsConstructor
 @NoArgsConstructor
 public class MapView {
 
  /** Constructor for single map mode */
  public MapView(MapRow row, MapRowTarget target, Instant latestNote) {
    this.rowId = row.getId();
    this.sourceId = row.getSourceCode().getId();
    this.sourceIndex = row.getSourceCode().getIndex();
    this.sourceCode = row.getSourceCode().getCode();
    this.sourceDisplay = row.getSourceCode().getDisplay();
    this.noMap = row.isNoMap();
    this.latestNote = latestNote;

    this.appendedNotes = "";
    Iterator<Note> i = row.getNotes().iterator();
    while (i.hasNext()) {
      Note note = i.next();
      if (!note.isDeleted()) {
        this.appendedNotes += note.getCreated() + " " + note.noteBy.getFullName() + " " + note.noteText + ";";
      }
    }

    this.status = row.getStatus();
    this.lastAuthor = row.getLastAuthor();
    this.lastReviewer = row.getLastReviewer();
    if (row.getAuthorTask() != null) {
      this.assignedAuthor = new ArrayList<User>();
      this.assignedAuthor.add(row.getAuthorTask().getAssignee());
    }
    if (row.getReviewTask() != null) {
      this.assignedReviewer = row.getReviewTask().getAssignee();
    }  
    if (null != target) {
      this.targetId = target.getId();
      this.targetCode = target.getTargetCode();
      this.targetDisplay = target.getTargetDisplay();
      this.relationship = target.getRelationship();
      this.flagged = target.isFlagged();
      this.targetTags = target.getTags();
    }
    if (row.getSourceCode().getAdditionalColumns().size() > 0) {
      this.additionalColumns = row.getSourceCode().getAdditionalColumns();
    }
  }

  /** Constructor for dual map mode - view screen */
  public MapView(MapRow row, MapRowTarget target, Instant latestNote, MapStatus status, Task siblingRowAuthorTask) {

    this.rowId = row.getId();
    this.sourceId = row.getSourceCode().getId();
    this.sourceIndex = row.getSourceCode().getIndex();
    this.sourceCode = row.getSourceCode().getCode();
    this.sourceDisplay = row.getSourceCode().getDisplay();

    if (row.getBlindMapFlag()) {
      this.noMap = false;
      this.latestNote = null;
      this.lastAuthor = null;
      this.lastReviewer = null;
    } else {
      this.noMap = row.isNoMap();
      this.latestNote = latestNote;
      this.lastAuthor = row.getLastAuthor();
      this.lastReviewer = row.getLastReviewer();
    }

    this.appendedNotes = "";
    Iterator<Note> i = row.getNotes().iterator();
    while (i.hasNext()) {
      Note note = i.next();
      if (!note.isDeleted()) {
        this.appendedNotes += note.getCreated() + " " + note.noteBy.getFullName() + " " + note.noteText + ";";
      }
    }

    this.status = (status != null ? status : row.getStatus());

    if (row.getAuthorTask() != null) {

      this.assignedAuthor = new ArrayList<User>();
      this.assignedAuthor.add(row.getAuthorTask().getAssignee());
      if (siblingRowAuthorTask != null) {
        this.assignedAuthor.add(siblingRowAuthorTask.assignee);
      }

    }
    if (row.getReviewTask() != null) {
      this.assignedReviewer = row.getReviewTask().getAssignee();
    }
    if (row.getReconcileTask() != null) {
      this.assignedReconciler = row.getReconcileTask().getAssignee();
    }  
    if (null != target && !row.getBlindMapFlag()) {
      this.targetId = target.getId();
      this.targetCode = target.getTargetCode();
      this.targetDisplay = target.getTargetDisplay();
      this.relationship = target.getRelationship();
      this.flagged = target.isFlagged();
      this.targetTags = target.getTags();
    }
    if (row.getSourceCode().getAdditionalColumns().size() > 0) {
      this.additionalColumns = row.getSourceCode().getAdditionalColumns();
    }

  }

  /** Constructor for dual map mode - task screen */
  public MapView(MapRow row, MapRowTarget target, Instant latestNote, MapStatus status) {

    this.rowId = row.getId();
    this.sourceId = row.getSourceCode().getId();
    this.sourceIndex = row.getSourceCode().getIndex();
    this.sourceCode = row.getSourceCode().getCode();
    this.sourceDisplay = row.getSourceCode().getDisplay();

    this.noMap = row.isNoMap();
    this.latestNote = latestNote;
    this.lastAuthor = row.getLastAuthor();
    this.lastReviewer = row.getLastReviewer();

    this.appendedNotes = "";
    List<Note> sortedNotes = new ArrayList<>(row.getNotes()); 

    // Sort the List by note.getCreated()
    Collections.sort(sortedNotes, Comparator.comparing(Note::getCreated).reversed());
    
    for (Note note : sortedNotes) {
      if (!note.isDeleted() && note.getCategory() == NoteCategory.USER) {
        this.appendedNotes += note.getCreated() + " " + note.noteBy.getFullName() + " " + note.noteText + ";";
      }
    }

    this.status = row.getStatus();

    if (row.getAuthorTask() != null) {
      this.assignedAuthor = new ArrayList<User>();
      this.assignedAuthor.add(row.getAuthorTask().getAssignee());
    }
    if (row.getReviewTask() != null) {
      this.assignedReviewer = row.getReviewTask().getAssignee();
    }
    if (null != target) {
      this.targetId = target.getId();
      this.targetCode = target.getTargetCode();
      this.targetDisplay = target.getTargetDisplay();
      this.relationship = target.getRelationship();
      this.flagged = target.isFlagged();      
      this.targetTags = target.getTags();
    }
    if (row.getSourceCode().getAdditionalColumns().size() > 0) {
      this.additionalColumns = row.getSourceCode().getAdditionalColumns();
    }
  }
 
   @NotNull
   private Long rowId;
 
   @NotNull
   private Long sourceId;

   @NotNull
   private Long sourceIndex;
 
   @NotNull
   private String sourceCode;
 
   @NotNull
   private String sourceDisplay;
 
   private Boolean noMap;
 
   private Long targetId;
 
   private String targetCode;
 
   private String targetDisplay;
 
   private MappingRelationship relationship;
 
   private MapStatus status;
 
   @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSXXX", timezone = "UTC")
   private Instant latestNote;

   private String appendedNotes;
 
   private List<User> assignedAuthor;
 
   private User assignedReviewer;

   private User assignedReconciler;
 
   private User lastAuthor;
 
   private User lastReviewer;
 
   private boolean flagged;
 
   private Set<String> targetTags;
 
   private List<AdditionalCodeValue> additionalColumns;

}
