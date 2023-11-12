package org.snomed.snap2snomed.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.User;

import javax.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
public class ProjectDto {

  private Instant created;
  private Instant modified;
  private long mapCount;

  @NotNull
  private Long id;

  @NotNull
  private String title;

  @NotNull
  private String description;

  @NotNull
  private List<@NotNull Map> maps;

  @NotNull
  private Boolean dualMapMode;

  @NotNull
  private Set<@NotNull User> owners;

  private Set<@NotNull User> members;

  private Set<@NotNull User> guests;

  public ProjectDto(Project project) {
    this.created = project.getCreated();
    this.modified = project.getModified();
    this.id = project.getId();
    this.title = project.getTitle();
    this.description = project.getDescription();
    this.maps = project.getMaps();
    this.mapCount = project.getMaps().size();
    this.dualMapMode = project.getDualMapMode();
    this.owners = project.getOwners();
    this.members = project.getMembers();
    this.guests = project.getGuests();
  }
}
