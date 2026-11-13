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
 
 import java.util.HashSet;
 import java.util.Set;
 import jakarta.validation.constraints.NotNull;
 
 import org.hibernate.Hibernate;
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
    // Hibernate.unproxy() needed for the same reason as the dual-map-mode constructors below -
    // jackson-datatype-hibernate6 can serialize a genuinely-loaded lastAuthor/lastReviewer
    // association as null if it's still proxy-shaped when handed to it.
    this.lastAuthor = (User) Hibernate.unproxy(row.getLastAuthor());
    this.lastReviewer = (User) Hibernate.unproxy(row.getLastReviewer());
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
      this.targetTags = target.getTags() != null ? new HashSet<>(target.getTags()) : null;
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
      // Deliberately hidden while still blind: this row's own sibling hasn't necessarily
      // reached the same answer yet, and revealing who last touched it (as opposed to who it's
      // merely assigned to, which reveals nothing about content) risks exposing blind-mapping
      // state before both sides have independently committed. Once blindMapFlag flips false -
      // either the two sides merged into MAPPED or diverged into RECONCILE - it's safe to show.
      this.lastAuthor = null;
      this.lastReviewer = null;
    } else {
      this.noMap = row.isNoMap();
      this.latestNote = latestNote;
      // Hibernate.unproxy() needed for the same reason as siblingRowAuthorTask.getAssignee()
      // below: row itself is a top-level entity built via the same native @SqlResultSetMapping
      // (MapViewService.getMapResults' "DualMapViewResult"), so jackson-datatype-hibernate6
      // treats its direct associations as lazy proxies and serializes them as null even once
      // genuinely loaded via the getter.
      this.lastAuthor = (User) Hibernate.unproxy(row.getLastAuthor());
      this.lastReviewer = (User) Hibernate.unproxy(row.getLastReviewer());
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
        // Must go through the getter, not the raw field - siblingRowAuthorTask is populated via
        // a native @SqlResultSetMapping (see MapViewService.getMapResults), and Hibernate's
        // lazy-loading bytecode enhancement only resolves the association through its
        // getter/property accessor. Direct field access bypasses that interceptor and always
        // sees the field's uninitialized (null) state, silently dropping the second author.
        //
        // Hibernate.unproxy() is also required here (unlike the row.getAuthorTask() case above):
        // jackson-datatype-hibernate6 auto-registers and treats this getAssignee() result as a
        // lazy Hibernate proxy tied to this native-query-constructed Task, serializing it as null
        // regardless of it already being genuinely populated. Unproxying hands Jackson the plain
        // concrete User instance instead, so the module has nothing proxy-shaped to second-guess.
        this.assignedAuthor.add((User) Hibernate.unproxy(siblingRowAuthorTask.getAssignee()));
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
      this.targetTags = target.getTags() != null ? new HashSet<>(target.getTags()) : null;
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
    // Hibernate.unproxy() needed for the same reason as the dual-map-mode "view screen"
    // constructor above - jackson-datatype-hibernate6 can serialize a genuinely-loaded
    // lastAuthor/lastReviewer association as null if it's still proxy-shaped when handed to it.
    this.lastAuthor = (User) Hibernate.unproxy(row.getLastAuthor());
    this.lastReviewer = (User) Hibernate.unproxy(row.getLastReviewer());

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
      this.targetTags = target.getTags() != null ? new HashSet<>(target.getTags()) : null;
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
