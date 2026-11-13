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
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Data
@Builder
@Audited
@EntityListeners(AuditingEntityListener.class)
@Table(name = "\"user\"")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements Snap2SnomedEntity {
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
  @NotBlank
  @Size(min = 1, max = 255, message = "Subject identifier must be between 1 and 255 characters")
  private String id;

  @NotBlank
  @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
  private String givenName;

  @NotBlank
  @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
  private String familyName;

  @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
  private String nickname;

  @NotEmpty
  @Email(message = "User must have a valid email address")
  private String email;
  
  private String acceptedTermsVersion;

  public String getFullName() {
    return givenName + " " + familyName;
  }

}
