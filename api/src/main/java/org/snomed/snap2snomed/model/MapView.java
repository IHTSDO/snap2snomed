package org.snomed.snap2snomed.model;

import java.time.Instant;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MapView {

  public MapView(MapRow row, MapRowTarget target, Instant latestNote) {
    this.rowId = row.getId();
    this.sourceIndex = row.getSourceCode().getIndex();
    this.sourceCode = row.getSourceCode().getCode();
    this.sourceDisplay = row.getSourceCode().getDisplay();
    this.noMap = row.isNoMap();
    this.latestNote = latestNote;
    this.status = row.getStatus();
    this.lastAuthor = row.getLastAuthor();
    this.lastReviewer = row.getLastReviewer();
    if (row.getAuthorTask() != null) {
      this.assignedAuthor = row.getAuthorTask().getAssignee();
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

  private Instant latestNote;

  private User assignedAuthor;

  private User assignedReviewer;

  private User lastAuthor;

  private User lastReviewer;

  private boolean flagged;

}
