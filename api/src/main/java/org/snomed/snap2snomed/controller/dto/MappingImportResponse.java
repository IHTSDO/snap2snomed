package org.snomed.snap2snomed.controller.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data
@NoArgsConstructor
public class MappingImportResponse {
  @NonNull
  Long recordCount;

  @NonNull
  Integer insertCount;

  @NonNull
  ValidationResult targetValidation;

}
