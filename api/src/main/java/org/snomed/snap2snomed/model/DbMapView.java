package org.snomed.snap2snomed.model;

import org.hibernate.annotations.Immutable;
import org.snomed.snap2snomed.model.enumeration.MapStatus;

import jakarta.persistence.Column;
import jakarta.persistence.ColumnResult;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityResult;
import jakarta.persistence.FetchType;
import jakarta.persistence.FieldResult;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.SqlResultSetMapping;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;

@Entity
@Immutable
@Table(name = "map_view")
@SqlResultSetMapping(
  name="DualMapViewResult",
        entities = {
          @EntityResult(
                entityClass = MapRow.class,
                fields = {
                    @FieldResult(name = "id",           column = "col_0_0_"),
                    @FieldResult(name = "map",          column = "map_id12_13_0_"),
                    @FieldResult(name = "sourceCode",   column = "source_15_13_0_"),
                    @FieldResult(name = "noMap",        column = "no_map7_13_0_"),
                    @FieldResult(name = "status",       column = "status8_13_0_"),
                    @FieldResult(name = "authorTask",   column = "author_t9_13_0_"),
                    @FieldResult(name = "reviewTask",   column = "review_14_13_0_"),
                    @FieldResult(name = "reconcileTask",column = "reconci13_13_0_"),
                    @FieldResult(name = "lastAuthor",   column = "last_au10_13_0_"),
                    @FieldResult(name = "lastReviewer", column = "last_re11_13_0_"),
                    @FieldResult(name = "blindMapFlag", column = "blind_ma2_13_0_"),
                    @FieldResult(name = "created",      column = "created3_13_0_"),
                    @FieldResult(name = "createdBy",    column = "created_4_13_0_"),
                    @FieldResult(name = "modified",     column = "modified5_13_0_"),
                    @FieldResult(name = "modifiedBy",   column = "modified6_13_0_"),
                  }),
          @EntityResult(
                entityClass = MapRowTarget.class,
                fields = {
                    @FieldResult(name = "id",           column = "col_1_0_"),
                    @FieldResult(name = "row",          column = "row_id11_9_1_"),
                    @FieldResult(name = "targetCode",   column = "target_c8_9_1_"),
                    @FieldResult(name = "targetDisplay",column = "target_d9_9_1_"),
                    @FieldResult(name = "relationship", column = "relation7_9_1_"),
                    @FieldResult(name = "flagged",      column = "flagged4_9_1_"),
                    @FieldResult(name = "lastAuthor",   column = "last_au10_9_1_"),
                    @FieldResult(name = "created",      column = "created2_9_1_"),
                    @FieldResult(name = "createdBy",    column = "created_3_9_1_"),
                    @FieldResult(name = "modified",     column = "modified5_9_1_"),
                    @FieldResult(name = "modifiedBy",   column = "modified6_9_1_"),
                  }),
          @EntityResult(
                entityClass = Task.class,
                fields = {
                    @FieldResult(name = "id",           column = "col_4_0_"),
                    @FieldResult(name = "assignee",     column = "assignee8_26_2_"),
                    @FieldResult(name = "map",          column = "map_id9_26_2_"),
                    @FieldResult(name = "description",  column = "descript4_26_2_"),
                    @FieldResult(name = "type",         column = "type7_26_2_"),
                    @FieldResult(name = "created",      column = "created2_26_2_"),
                    @FieldResult(name = "createdBy",    column = "created_3_26_2_"),
                    @FieldResult(name = "modified",     column = "modified5_26_2_"),
                    @FieldResult(name = "modifiedBy",   column = "modified6_26_2_"),
                  }),
        },
        columns = {
          @ColumnResult(name = "col_2_0_", type = Instant.class), // latest note
          @ColumnResult(name = "col_3_0_", type = Integer.class) // map_view.status  .. needs to be converted to an enum
        }
)

public class DbMapView implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String mapRowId;

    @Column 
    private Long mapId;

    @Column
    private MapStatus status;

    @Column
    private Long siblingRowAuthorTaskId;

    @Column
    private Boolean blindMapFlag;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mapRowId", insertable = false, updatable = false)
    MapRow mapRow;

    @OneToOne
    @JoinColumn(name = "siblingRowAuthorTaskId", insertable = false, updatable = false)
    Task siblingRowAuthorTask;

}
