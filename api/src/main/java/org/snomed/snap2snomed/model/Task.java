/*
 * Copyright © 2022 SNOMED International
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

import java.time.Instant;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.envers.Audited;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.snomed.snap2snomed.util.SourceRowSpecificationUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.data.rest.core.config.Projection;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Data
@Builder
@Audited
@EntityListeners(AuditingEntityListener.class)
@Table(name = "task")
@Slf4j
public class Task implements Snap2SnomedEntity {
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

  @Size(max = 60, message = "Description must be less than 60 characters")
  String description;

  @ReadOnlyProperty
  @NotNull(message = "A task must always have a task type")
  TaskType type;

  @ReadOnlyProperty
  @NotNull(message = "A task must always be associated with a map")
  @ManyToOne
  private Map map;

  @ManyToOne
  User assignee;

  @Pattern(regexp = SourceRowSpecificationUtils.SOURCE_ROW_SPECIFICATION_PATTERN,
      message = "The source row specification must be expressed as a comma separated list of row numbers or ranges or '*' - e.g. 1,5,15-20,25")
  @Size(max = 32768)
  @Transient
  @EqualsAndHashCode.Exclude
  String sourceRowSpecification;

  @Transient
  @EqualsAndHashCode.Exclude
  Integer sourceRowCount;

  @Transient
  Boolean allowAssigneeToBeAuthorAndReviewer;

  @Transient
  Boolean reassignAlreadyAssignedRows;

  @Projection(name = "embeddedTaskDetails", types = {Task.class})
  public interface EmbeddedTaskDetails {

    long getId();

    String getDescription();

    TaskType getType();

    Map getMap();

    @Value("#{target.map?.id}")
    String getMapId();

    @Value("#{target.map?.project}")
    Project getMapProject();

    User getAssignee();

    @Value("#{target.assignee?.id}")
    String getAssigneeId();

    @Value("#{@sourceRowSpecificationBean.calculateSourceRowSpecification(target)}")
    String getSourceRowSpecification();

    @Value("#{@sourceRowSpecificationBean.calculateSourceRowCount(target)}")
    String getSourceRowCount();

    Instant getCreated();

    Instant getModified();

    @Value("#{target.map.source}")
    ImportedCodeSet getSource();

  }

}
