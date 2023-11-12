package org.snomed.snap2snomed.repository;

import org.snomed.snap2snomed.model.DbMapView;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional
public interface DbMapViewRepository extends PagingAndSortingRepository<DbMapView, String> {

}