package org.snomed.snap2snomed.controller.dto;

import javax.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ImportMappingFileDetails {

  @NotNull(message = "An index for the codes in a mapping import file must be specified")
  Integer codeColumnIndex;

  @NotNull(message = "An index for the target codes column in a mapping import file must be specified")
  Integer targetCodeColumnIndex;

  @NotNull(message = "An index for the target display column in a mapping import file must be specified")
  Integer targetDisplayColumnIndex;

  @NotNull(message = "An index for the relationship column in a mapping import file must be specified")
  Integer relationshipColumnIndex;

  @NotNull(message = "ID of the map for the targets")
  String mapId;

  Character delimiter;

  Boolean hasHeader = false;

}
