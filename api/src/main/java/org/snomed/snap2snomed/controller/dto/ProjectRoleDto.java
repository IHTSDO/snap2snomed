package org.snomed.snap2snomed.controller.dto;

import java.util.Set;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.Data;
import org.snomed.snap2snomed.model.User;

@Data
public class ProjectRoleDto {

  @Size(min = 1, message = "Project must have at least one owner")
  @NotNull
  private Set<@NotNull User> owners;

  private Set<@NotNull User> members;

  private Set<@NotNull User> guests;

}
