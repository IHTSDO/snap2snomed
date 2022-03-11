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
import org.snomed.snap2snomed.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.core.annotation.RestResource;

@RepositoryRestResource
public interface ProjectRepository
    extends RevisionRepository<Project, Long, Integer>, PagingAndSortingRepository<Project, Long> {

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Override
  @Query("select p from Project p where true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of p.owners or u member of p.members or u member of p.guests)) ")
  Page<Project> findAll(Pageable pageable);

  // authorisation in PreAuthFilter
  @Override
  Optional<Project> findById(Long project);

  // authorisation in PreAuthFilter
  @Override
  boolean existsById(Long project);

  // authorisation in event handler
  @Override
  <S extends Project> S save(S project);

  // ---------------------------------
  // NOT exported in REST interface
  // ---------------------------------

  @RestResource(exported = false)
  @Override
  Iterable<Project> findAllById(Iterable<Long> projectIds);

  @Override
  @RestResource(exported = false)
  <S extends Project> Iterable<S> saveAll(Iterable<S> entities);

  @Override
  @RestResource(exported = false)
  void delete(Project entity);

  @Override
  @RestResource(exported = false)
  void deleteById(Long id);

  @Override
  @RestResource(exported = false)
  void deleteAll();

  @Override
  @RestResource(exported = false)
  void deleteAll(Iterable<? extends Project> entities);

  @Override
  @RestResource(exported = false)
  void deleteAllById(Iterable<? extends Long> ids);

  @RestResource(exported = false)
  @Override
  long count();

  @Override
  @RestResource(exported = false)
  Iterable<Project> findAll(Sort sort);

  @Override
  @RestResource(exported = false)
  Iterable<Project> findAll();

  @RestResource(exported = false)
  @Query("select p from Project p join p.maps m join MapRow mr on mr.map = m and mr.id = :mapRowId")
  Optional<Project> findByMapRowId(Long mapRowId);
}
