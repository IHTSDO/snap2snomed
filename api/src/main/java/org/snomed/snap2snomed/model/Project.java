package org.snomed.snap2snomed.model;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.rest.core.config.Projection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.envers.Audited;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Audited
@EntityListeners(AuditingEntityListener.class)
@Table(name = "project")
public class Project implements Snap2SnomedEntity {
  @Column(name = "created", nullable = false, updatable = false)
  @CreatedDate
  private Instant created;

  @Column(name = "modified")
  @LastModifiedDate
  private Instant modified;

  @Column(name = "created_by", updatable = false)
  @CreatedBy
  private String createdBy;

  @Column(name = "modified_by")
  @LastModifiedBy
  private String modifiedBy;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank(message = "Project title is mandatory")
  @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
  private String title;

  @Size(min = 1, max = 200, message = "Description must be between 1 and 200 characters")
  private String description;

  @OneToMany(mappedBy = "project", cascade = CascadeType.PERSIST)
  @ToString.Exclude
  @EqualsAndHashCode.Exclude
  private List<@NotNull Map> maps;

  @Size(min = 1, message = "Project must have at least one owner")
  @NotNull
  @ManyToMany
  @JoinTable(name = "project_owners", joinColumns = @JoinColumn(name = "project_id"), inverseJoinColumns = @JoinColumn(name = "owners_id"))
  private Set<@NotNull User> owners;

  @ManyToMany
  @JoinTable(name = "project_members", joinColumns = @JoinColumn(name = "project_id"), inverseJoinColumns = @JoinColumn(name = "members_id"))
  private Set<@NotNull User> members;

  @ManyToMany
  @JoinTable(name = "project_guests", joinColumns = @JoinColumn(name = "project_id"), inverseJoinColumns = @JoinColumn(name = "guests_id"))
  private Set<@NotNull User> guests;

  @Projection(name = "listView", types = {Project.class})
  public interface ListView {

    long getId();

    String getTitle();

    String getDescription();

    Instant getCreated();

    Instant getModified();

    @Value("#{target.getMaps().size()}")
    long getMapCount();

    @Value("#{target.getMaps()}")
    List<Map> getMaps();

  }

  @Projection(name = "listUsers", types = {Project.class})
  public interface listUsers {

    Set<User> getOwners();

    Set<User> getMembers();

    Set<User> getGuests();

  }

}
