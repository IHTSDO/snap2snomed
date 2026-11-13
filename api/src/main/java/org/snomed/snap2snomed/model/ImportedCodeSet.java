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
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.hibernate.envers.Audited;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Data
@Builder
@Audited
@EntityListeners(AuditingEntityListener.class)
@Table(name = "imported_codeset")
public class ImportedCodeSet implements Snap2SnomedEntity {

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

  @ReadOnlyProperty
  @NotBlank(message = "name is mandatory")
  @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
  String name;

  @ReadOnlyProperty
  @NotBlank(message = "version is mandatory")
  @Size(min = 1, max = 30, message = "Version must be between 1 and 30 characters")
  String version;

  @Size(min = 1, max = 255, message = "CodeSystem URI must be between 1 and 255 characters")
  String systemUri;

  @Size(min = 1, max = 255, message = "ValueSet URI must be between 1 and 255 characters")
  String valuesetUri;

  @ReadOnlyProperty
  @ElementCollection(fetch = FetchType.EAGER)
  @OrderColumn(name = "collection_order")
  @CollectionTable(
    name="IMPORTED_CODESET_ADDITIONAL_COLUMNS",
    joinColumns=@JoinColumn(name="IMPORTED_CODESET_ID")
  )
  List<AdditionalCodeColumn> additionalColumnsMetadata;

}
