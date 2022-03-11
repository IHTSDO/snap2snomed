package org.snomed.snap2snomed.controller.dto;

import javax.validation.constraints.NotNull;

import lombok.Data;

@Data
public class AutomapRowDto {

  final private @NotNull Long id;

  final private @NotNull String display;

}
