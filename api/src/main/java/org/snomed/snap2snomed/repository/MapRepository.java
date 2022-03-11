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

import java.util.Optional;
import java.util.Set;
import org.snomed.snap2snomed.model.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.core.annotation.RestResource;

@RepositoryRestResource
public interface MapRepository
    extends RevisionRepository<Map, Long, Integer>, PagingAndSortingRepository<Map, Long> {

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Override
  <S extends Map> S save(S map);

  @Query("select m from Map m where true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of m.project.owners or u member of m.project.members or u member of m.project.guests)) ")
  @Override
  Page<Map> findAll(Pageable pageable);

  //  Authorisation in PreAuthFilter
  @Override
  Optional<Map> findById(Long id);

  // ---------------------------------
  // NOT exported in REST interface
  // ---------------------------------

  @RestResource(exported = false)
  @Query("select m from Map m where m.project.id = :projectId and m.mapVersion = :version")
  Set<Map> findAllByProjectIdAndVersion(Long projectId, String version);

  @Override
  @RestResource(exported = false)
  <S extends Map> Iterable<S> saveAll(Iterable<S> maps);

  @Override
  @RestResource(exported = false)
  void delete(Map entity);

  @Override
  @RestResource(exported = false)
  void deleteById(Long id);

  @Override
  @RestResource(exported = false)
  void deleteAll();

  @Override
  @RestResource(exported = false)
  void deleteAll(Iterable<? extends Map> entities);

  @Override
  @RestResource(exported = false)
  void deleteAllById(Iterable<? extends Long> ids);

  @Override
  @RestResource(exported = false)
  Iterable<Map> findAll(Sort sort);

  @Override
  @RestResource(exported = false)
  boolean existsById(Long aLong);

  @Override
  @RestResource(exported = false)
  Iterable<Map> findAll();

  @Override
  @RestResource(exported = false)
  Iterable<Map> findAllById(Iterable<Long> longs);

  @Override
  @RestResource(exported = false)
  long count();

}
