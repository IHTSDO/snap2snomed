package org.snomed.snap2snomed.controller.dto;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class MappingDetails {

  private Long rowId;

  private Long taskId;

  private List<MappedRowDetailsDto> selection;
 
  private MappingDto mappingUpdate;

}
