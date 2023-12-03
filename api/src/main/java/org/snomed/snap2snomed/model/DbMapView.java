package org.snomed.snap2snomed.model;

import org.hibernate.annotations.Immutable;
import org.snomed.snap2snomed.model.enumeration.MapStatus;

import javax.persistence.Column;
import javax.persistence.ColumnResult;
import javax.persistence.Entity;
import javax.persistence.EntityResult;
import javax.persistence.FetchType;
import javax.persistence.FieldResult;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.SqlResultSetMapping;
import javax.persistence.Table;
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
                    @FieldResult(name = "id", column = "col_0_0_"),
                  }),
          @EntityResult(
                entityClass = MapRowTarget.class,
                fields = {
                    @FieldResult(name = "id", column = "col_1_0_")
                  }),
          @EntityResult(
                entityClass = Task.class,
                fields = {
                    @FieldResult(name = "id", column = "col_4_0_")
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
