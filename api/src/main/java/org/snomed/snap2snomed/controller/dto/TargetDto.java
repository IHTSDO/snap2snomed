package org.snomed.snap2snomed.controller.dto;

import lombok.Data;

@Data
public class TargetDto {
  private String code;
  private String display;
  private Boolean inactive;
  private String label;
  private String system;
  private String tag;
  private String version;
}
