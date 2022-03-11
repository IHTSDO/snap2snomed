package org.snomed.snap2snomed.model;

import java.time.Instant;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

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

}
