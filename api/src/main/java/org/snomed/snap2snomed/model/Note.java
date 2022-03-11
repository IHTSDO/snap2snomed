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
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.builder.CompareToBuilder;
import org.hibernate.envers.Audited;
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
@Table(name = "note")
public class Note implements Comparable<Note>, Snap2SnomedEntity {
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

    @NotNull(message = "A note must always have a Map Row")
    @ManyToOne
    @JoinColumn(name = "MAPROW_ID")
    private MapRow mapRow;

    @NotNull(message = "A note must always have text")
    @Size(min = 1, max = 256, message = "Text for a note must be between 1 and 256 characters")
    String noteText;

    @NotNull(message = "A note must always have an author")
    @ManyToOne
    User noteBy;

    @Override
    public int compareTo(Note o) {
        // NB other fields are included to prevent collisions in sorted sets
        return new CompareToBuilder().append(o.getModified(), this.getModified())
            .append(o.getCreated(), this.getCreated()).append(o.getId(), this.getId())
            .append(this.getMapRow(), o.getMapRow()).append(this.getNoteBy(), o.getNoteBy())
            .append(this.getNoteText(), o.getNoteText())
            .toComparison();
    }

    @Projection(name = "noteView", types = {Note.class})
    public interface NoteView {

        long getId();

        MapRow getMapRow();

        User getNoteBy();

        String getNoteText();

        Instant getCreated();

        Instant getModified();
    }

}
