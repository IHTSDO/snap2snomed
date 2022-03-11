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
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.springframework.beans.factory.annotation.Value;
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
@Table(name = "map_row_target")
public class MapRowTarget implements Snap2SnomedEntity {
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

    @NotNull(message = "A MapRowTarget must always belong to a row")
    @ManyToOne
    @EqualsAndHashCode.Exclude
    private MapRow row;

    @NotEmpty(message = "A MapRowTarget must always have a target code")
    @Size(max = 18)
    private String targetCode;

    @NotEmpty(message = "A MapRowTarget must always have a target display")
    @Size(max = 2048) // allows for long descriptions in some extensions (looking at you AMT)
    private String targetDisplay;

    @NotNull(message = "A MapRowTarget must always have a relationship type")
    @Builder.Default
    private MappingRelationship relationship = MappingRelationship.TARGET_INEXACT;

    boolean flagged;


    @Projection(name = "targetView", types = {MapRowTarget.class})
    public interface TargetView {

        Long getId();

        @Value(value = "#{target.row}")
        MapRow getRow();

        @Value(value = "#{target.row.map}")
        Map getMapping();

        @Value(value = "#{target.row.sourceCode}")
        ImportedCode getSource();

        String getTargetCode();

        String getTargetDisplay();

        String getRelationship();

        boolean getFlagged();

    }
}
