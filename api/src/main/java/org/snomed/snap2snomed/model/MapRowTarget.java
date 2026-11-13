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
import java.util.Set;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.model.enumeration.TaskType;
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
public class MapRowTarget implements Snap2SnomedEntity, java.lang.Comparable<MapRowTarget> {
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

    /**
     * A set of string tag values that can be used for a wide variety of purposes.
     */
    @ElementCollection
    private Set<String> tags;

    boolean flagged;

    @ManyToOne
    @JoinColumn(name = "last_author_id")
    private User lastAuthor;

    @Transient
    private TaskType taskType;

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

        Set<String> getTags();

        User getLastAuthor();

    }

    @Override
    public int compareTo(MapRowTarget o) {
        return targetCode.compareTo(o.getTargetCode());
    }
}
