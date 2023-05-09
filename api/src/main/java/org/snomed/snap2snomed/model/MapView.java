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
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

import java.util.Set;
import javax.validation.constraints.NotNull;

import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.springframework.beans.factory.annotation.Autowired;

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

  private boolean isMasterAuthorTaskLoggedInUser(MapRow row, String loggedInUser) {
    if (row.getAuthorTask() != null && row.getAuthorTask().getAssignee().getId().equals(loggedInUser)) {
      return true;
    }
    return false;
  }

  private boolean isChildAuthorTaskLoggedInUser(MapRow row, String loggedInUser) {
    if (row.getChildMapRow() != null &&
        row.getChildMapRow().getAuthorTask() != null && 
        row.getChildMapRow().getAuthorTask().getAssignee().getId().equals(loggedInUser)) {
      return true;
    }
    return false;
  }

  private boolean isDualMap(MapRow row) {
    return row.getMap().getProject().getDualMapMode();
  }

  @Autowired private AuthenticationFacade authenticationFacade;

  public MapView(MapRow row, MapRowTarget target, Instant latestNote, String loggedInUser) {

    this.rowId = row.getId();
    this.sourceIndex = row.getSourceCode().getIndex();
    this.sourceCode = row.getSourceCode().getCode();
    this.sourceDisplay = row.getSourceCode().getDisplay();

    // --- NO MAP FLAG
    if (!isDualMap(row) || (isDualMap(row) && isMasterAuthorTaskLoggedInUser(row, loggedInUser))) {
      this.noMap = row.isNoMap();
    }
    else if (isDualMap(row) && isChildAuthorTaskLoggedInUser(row, loggedInUser)) {
      this.noMap = row.getChildMapRow().isNoMap();
    }

    // --- NOTE 
    if (!isDualMap(row) || (isDualMap(row) && isMasterAuthorTaskLoggedInUser(row, loggedInUser))) {
      this.latestNote = latestNote;
    }
    else if (isDualMap(row) && isChildAuthorTaskLoggedInUser(row, loggedInUser)) {
      this.latestNote = latestNote;
    }

    // --- STATUS .. logic could be condensed but left this way to assist with understanding for now
    if (!isDualMap(row)) { 
      this.status = row.getStatus();
    }
    else if (isMasterAuthorTaskLoggedInUser(row, loggedInUser)) {
      this.status = row.getStatus();
    }
    else if (isChildAuthorTaskLoggedInUser(row, loggedInUser)) {
      this.status = row.getChildMapRow().getStatus();
    }
    else if (row.getChildMapRow() != null && row.getStatus() != row.getChildMapRow().getStatus()) { 
      // dual map but not an author .. show as draft if the rows are now in agreement
      this.status = MapStatus.DRAFT;
    }
    else {
      this.status = row.getStatus();
    }


    // --- LAST AUTHOR
    if (!isDualMap(row) || (isDualMap(row) && isMasterAuthorTaskLoggedInUser(row, loggedInUser))) {
      // for dualMap the last author only makes sense in blind map mode when the last user is currently logged in
      // (i.e. consistency with single author mode)
      this.lastAuthor = row.getLastAuthor();
    }
    else if (isDualMap(row) && isChildAuthorTaskLoggedInUser(row, loggedInUser)) {
      this.lastAuthor = row.getChildMapRow().getLastAuthor();
    }

    // --- LAST REVIEWER
    this.lastReviewer = row.getLastReviewer();

    // --- ASSIGNED AUTHOR
    if (row.getAuthorTask() != null) {
      this.assignedAuthor =  new HashSet<>(Arrays.asList(row.getAuthorTask().getAssignee()));
      if (isDualMap(row) && row.getChildMapRow() != null && row.getChildMapRow().getAuthorTask() != null) {
        // for dual map mode, there are two authors
        this.assignedAuthor.add(row.getChildMapRow().getAuthorTask().getAssignee());
      }
    }

    if (row.getReviewTask() != null) {
      this.assignedReviewer = row.getReviewTask().getAssignee();
    }

    if (null != target && (!isDualMap(row) || (isDualMap(row) && (isMasterAuthorTaskLoggedInUser(row, loggedInUser) || isChildAuthorTaskLoggedInUser(row, loggedInUser))))) {
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

  private Set<User> assignedAuthor;

  private User assignedReviewer;

  private User lastAuthor;

  private User lastReviewer;

  private boolean flagged;

  private Set<String> targetTags;

  private List<AdditionalCodeValue> additionalColumns;
}
