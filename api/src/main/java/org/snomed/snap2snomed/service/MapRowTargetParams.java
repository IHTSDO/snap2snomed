package org.snomed.snap2snomed.service;

import org.snomed.snap2snomed.model.MapRowTarget;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class MapRowTargetParams {

  private MapRowTarget mapRowTarget;
  private String sourceCode;
  
}
