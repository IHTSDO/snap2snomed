package org.snomed.snap2snomed.controller.dto;

import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class MappedRowDetailsDto {

  @NotNull
  private Long mapRowId;

  @NotNull
  private Long sourceIndex;

  private Long mapRowTargetId;

}
