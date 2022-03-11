package org.snomed.snap2snomed.controller.dto;

import lombok.Builder;
import lombok.NonNull;
import lombok.Value;

@Value
@Builder
public class MappingResponse {

  @NonNull
  Long rowCount;
  
  @NonNull
  Long updatedRowCount;

  ValidationResult targetValidation;

}
