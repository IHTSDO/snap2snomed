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

package org.snomed.snap2snomed.repository;

import java.util.List;
import java.util.Optional;
import org.snomed.snap2snomed.model.ImportedCodeSet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.core.annotation.RestResource;

@RepositoryRestResource
public interface ImportedCodeSetRepository
    extends RevisionRepository<ImportedCodeSet, Long, Integer>, PagingAndSortingRepository<ImportedCodeSet, Long>{

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Override
  @Query("select distinct ics from ImportedCodeSet ics left join Map m on m.source.id = ics.id where ics.createdBy = ?#{@authenticationFacadeImpl.principalSubject} or true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of m.project.owners or u member of m.project.members or u member of m.project.guests)) ")
  Page<ImportedCodeSet> findAll(Pageable pageable);

  @RestResource(path = "byIdForOwner", rel = "byIdForOwner")
  @Query("select distinct ics from ImportedCodeSet ics where ics.id = :id and (ics.createdBy = ?#{@authenticationFacadeImpl.principalSubject} or true = ?#{@authenticationFacadeImpl.isAdminUser()}) ")
  Optional<ImportedCodeSet> findByIdForOwner(Long id);

  // ---------------------------------
  // NOT exported in REST interface
  // ---------------------------------

  @Override
  @RestResource(exported = false)
  Iterable<ImportedCodeSet> findAll();

  // disabled methods
  @RestResource(exported = false)
  @Query("select distinct ics.id from ImportedCodeSet ics left join Map m on m.source.id = ics.id where ics.createdBy = ?#{@authenticationFacadeImpl.principalSubject} or true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of m.project.owners or u member of m.project.members or u member of m.project.guests)) ")
  List<Long> findAuthorisedImportedCodeSets();

  @Override
  @RestResource(exported = false)
  Optional<ImportedCodeSet> findById(Long id);

  @Override
  @RestResource(exported = false)
  Iterable<ImportedCodeSet> findAll(Sort sort);

  @Override
  @RestResource(exported = false)
  void delete(ImportedCodeSet entity);

  @Override
  @RestResource(exported = false)
  void deleteById(Long id);

  @Override
  @RestResource(exported = false)
  void deleteAll();

  @Override
  @RestResource(exported = false)
  void deleteAll(Iterable<? extends ImportedCodeSet> entities);

  @Override
  @RestResource(exported = false)
  void deleteAllById(Iterable<? extends Long> ids);

  @Override
  @RestResource(exported = false)
  <S extends ImportedCodeSet> S save(S entity);

  @Override
  @RestResource(exported = false)
  <S extends ImportedCodeSet> Iterable<S> saveAll(Iterable<S> entities);

  @Override
  @RestResource(exported = false)
  boolean existsById(Long aLong);

  @Override
  @RestResource(exported = false)
  long count();

  @Override
  @RestResource(exported = false)
  Iterable<ImportedCodeSet> findAllById(Iterable<Long> longs);
}
