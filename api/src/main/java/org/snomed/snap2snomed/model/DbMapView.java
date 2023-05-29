package org.snomed.snap2snomed.model;

import org.hibernate.annotations.Immutable;
import org.snomed.snap2snomed.model.enumeration.MapStatus;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import java.io.Serializable;

@Entity
@Immutable
@Table(name = "map_view")
public class DbMapView implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String mapRowId;

    @Column
    private MapStatus status;

    @Column
    private Long siblingRowAuthorTaskId;

    @Column
    private Boolean blindMapFlag;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mapRowId", insertable = false, updatable = false)
    MapRow mapRow;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "siblingRowAuthorTaskId", insertable = false, updatable = false)
    Task siblingRowAuthorTask;

}
