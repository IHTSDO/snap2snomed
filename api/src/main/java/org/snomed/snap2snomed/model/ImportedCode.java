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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.ReadOnlyProperty;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Data
@Builder
@Table(name = "imported_code", indexes = {@Index(columnList = "_index, imported_codeset_id", unique = true),
    @Index(columnList = "code, imported_codeset_id", unique = true)})
public class ImportedCode implements Snap2SnomedEntity {

  public static final int DISPLAY_SIZE_LIMIT = 512;
  public static final int CODE_SIZE_LIMIT = 50;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ReadOnlyProperty
  @NotBlank
  @Size(max = CODE_SIZE_LIMIT)
  String code;

  @ReadOnlyProperty
  @NotNull
  @ManyToOne
  @JoinColumn(name = "imported_codeset_id")
  ImportedCodeSet importedCodeSet;

  @ReadOnlyProperty
  @NotNull
  @Column(name="_index")
  Long index;

  @ReadOnlyProperty
  @NotBlank
  @Size(max = DISPLAY_SIZE_LIMIT)
  String display;

}
