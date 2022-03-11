package org.snomed.snap2snomed.controller.dto;

import java.util.List;
import javax.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MappingUpdateDto {
  
  @NotNull
  List<MappingDetails> mappingDetails;
  
}
