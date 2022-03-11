package org.snomed.snap2snomed.controller.dto;

import lombok.Data;

@Data
public class MapCloneDto {
  private Long sourceId;
  private String mapVersion;
  private String toVersion;
  private String toScope;
}
