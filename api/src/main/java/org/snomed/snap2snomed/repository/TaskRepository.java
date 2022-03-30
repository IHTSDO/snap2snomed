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
import org.snomed.snap2snomed.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.core.annotation.RestResource;

@RepositoryRestResource
public interface TaskRepository
    extends RevisionRepository<Task, Long, Integer>, PagingAndSortingRepository<Task, Long> {

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Query("select t from Task t where t.map.id = :id and (true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of t.map.project.owners or u member of t.map.project.members or u member of t.map.project.guests))) ")
  Page<Task> findByMapId(Long id, Pageable pageable);

  @Override
  @Query("select t from Task t where true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of t.map.project.owners or u member of t.map.project.members or u member of t.map.project.guests)) ")
  Page<Task> findAll(Pageable pageable);

  @Override
  @Query("select t from Task t where t.id = :id and (true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of t.map.project.owners or u member of t.map.project.members or u member of t.map.project.guests))) ")
  Optional<Task> findById(Long id);

  // authorisation in event handler
  @Override
  <S extends Task> S save(S s);

  // authorisation in event handler
  @Override
  void delete(Task task);

  // authorisation in event handler
  @Override
  void deleteById(Long aLong);

  // ---------------------------------
  // NOT exported in REST interface
  // ---------------------------------

  @Override
  @RestResource(exported = false)
  <S extends Task> Iterable<S> saveAll(Iterable<S> iterable);

  @Override
  @RestResource(exported = false)
  void deleteAllById(Iterable<? extends Long> iterable);

  @Override
  @RestResource(exported = false)
  void deleteAll();

  @Override
  @RestResource(exported = false)
  void deleteAll(Iterable<? extends Task> entities);

  @RestResource(exported = false)
  @Override
  boolean existsById(Long id);

  @RestResource(exported = false)
  @Modifying
  @Query("delete from Task t where not exists (select 1 from MapRow mr where mr.authorTask = t or mr.reviewTask = t)")
  void deleteTasksWithNoMapRows();

  @RestResource(exported = false)
  @Override
  Iterable<Task> findAll(Sort sort);

  @RestResource(exported = false)
  @Override
  Iterable<Task> findAll();

  @RestResource(exported = false)
  @Override
  Iterable<Task> findAllById(Iterable<Long> longs);
}
