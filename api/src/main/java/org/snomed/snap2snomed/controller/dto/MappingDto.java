package org.snomed.snap2snomed.controller.dto;

import lombok.Builder;
import lombok.Data;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;

@Data
@Builder(toBuilder = true)
public class MappingDto {

  private Long targetId;

  private Boolean noMap;

  private MapStatus status;

  private MappingRelationship relationship;

  private Boolean clearTarget;

  public boolean isNoMap() {
    return noMap != null && noMap;
  }

  public boolean isOnlyStatusChange() {
    return status != null && relationship == null && noMap == null && (clearTarget == null || !clearTarget);
  }

  public boolean isNoChange() {
    return noMap == null && status == null && relationship == null && clearTarget == null;
  }

  public boolean isValid() {
    return (noMap != null && status == null && relationship == null && clearTarget == null)
        || (noMap == null && (status != null || relationship != null) && clearTarget == null)
        || (noMap == null && status == null && relationship == null && clearTarget != null);
  }
}
