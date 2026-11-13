/*
 * Copyright © 2022-23 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.snomed.snap2snomed.model;

import static org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import java.util.SortedSet;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString.Exclude;
import org.hibernate.envers.Audited;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.NoteCategory;
import org.snomed.snap2snomed.problem.mapping.InvalidStateTransitionProblem;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.data.rest.core.config.Projection;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Audited
@EntityListeners(AuditingEntityListener.class)
//TODO get this working + unique
// @Table(name = "map_row", uniqueConstraints = {
//     @UniqueConstraint(name = "UniqueIdAndMasterMapRowId", columnNames = {"map_id", "master_map_row_id"})})
public class MapRow implements Snap2SnomedEntity, Serializable {

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
  protected Long id;

  @NotNull
  @ManyToOne
  private Map map;

  @NotNull
  @OneToOne
  @Audited(targetAuditMode = NOT_AUDITED)
  private ImportedCode sourceCode;

  @Column(columnDefinition = "boolean default false")
  @Builder.Default
  private boolean noMap = false;

  @JsonIgnore
  @Transient
  @Builder.Default
  // NB this does not seem to be functional and I can't find a workaround
  // https://github.com/spring-projects/spring-data-rest/issues/753?focusedCommentId=127082&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-127082
  private boolean noMapPrevious = false;

  @NotNull
  @Builder.Default
  private MapStatus status = MapStatus.UNMAPPED;

  @OneToMany(mappedBy = "mapRow", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
  @EqualsAndHashCode.Exclude
  @Exclude
  private SortedSet<@NotNull Note> notes;

  @ManyToOne
  private Task authorTask;

  @ManyToOne
  private Task reviewTask;

  @ManyToOne
  private Task reconcileTask;

  @ManyToOne
  @JoinColumn(name = "last_author_id")
  private User lastAuthor;

  @ManyToOne
  @JoinColumn(name = "last_reviewer_id")
  private User lastReviewer;

  @OneToMany(mappedBy = "row", fetch = FetchType.EAGER, cascade = CascadeType.REMOVE)
  @Exclude
  List<MapRowTarget> mapRowTargets;

  @Column(name = "blind_map_flag")
  @NotNull
  private Boolean blindMapFlag;

  @Projection(name = "withLatestNote", types = {MapRow.class})
  public interface MapRowWithLatestNote {

    Long getId();

    Map getMap();

    ImportedCode getSourceCode();

    boolean isNoMap();

    boolean isNoMapPrevious();

    MapStatus getStatus();

    SortedSet<@NotNull Note> getNotes();

    Task getAuthorTask();

    Task getReviewTask();

    default Instant getLatestNote() {
      Note note = getNotes().stream().filter(n -> !n.isDeleted() && n.getCategory() == NoteCategory.USER).findFirst().orElse(null);
      if (note != null) {
        return note.getModified();
      }
      return null;
    }
  }

  // Store the previous Status so we can check status changes on updates/saves
  @JsonIgnore
  @Transient
  private MapStatus previousStatus;

  /**
   * Originally this was supposed to go into the RepositoryEventHandler, but @HandleBeforeSave and @HandleBeforeCreate do not fire unless
   * you save through REST. We do get here on JPARepository::save() that calls EntityManager::persist()
   * <p>
   * This also means we have to deal with org.springframework.transaction.TransactionSystemException in our code as
   * InvalidStateTransitionProblem will be wrapped up into that exception
   */
  @PrePersist
  protected void additionalPrePersist() {
    if (previousStatus != null && !previousStatus.isValidTransition(status)) {
      throw new InvalidStateTransitionProblem(previousStatus, status);
    }
  }

  @PostLoad
  private void setPreviousStatus() {
    previousStatus = status;
  }
}
