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
import org.snomed.snap2snomed.model.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.core.annotation.RestResource;

@RepositoryRestResource
public interface NoteRepository extends RevisionRepository<Note, Long, Integer>, PagingAndSortingRepository<Note, Long> {

    // ---------------------------------
    // Exported in REST interface
    // ---------------------------------

    @Query("select n from Note n where true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and n.mapRow.id = :id and (u member of n.mapRow.map.project.owners or u member of n.mapRow.map.project.members or u member of n.mapRow.map.project.guests)) ")
    Page<Note> findByMapRowId(Long id, Pageable pageable);

    @Override
    @Query("select n from Note n where true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of n.mapRow.map.project.owners or u member of n.mapRow.map.project.members or u member of n.mapRow.map.project.guests)) ")
    Page<Note> findAll(Pageable pageable);

    @Override
    @Query("select n from Note n where n.id = :id and (true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of n.mapRow.map.project.owners or u member of n.mapRow.map.project.members or u member of n.mapRow.map.project.guests))) ")
    Optional<Note> findById(Long id);

    // authorisation in event handler
    @Override
    <S extends Note> S save(S entity);

    // ---------------------------------
    // NOT exported in REST interface
    // ---------------------------------

    @Override
    @RestResource(exported = false)
    Iterable<Note> findAll();

    @Override
    @RestResource(exported = false)
    void delete(Note entity);

    @Override
    @RestResource(exported = false)
    <S extends Note> Iterable<S> saveAll(Iterable<S> iterable);

    @Override
    @RestResource(exported = false)
    void deleteById(Long aLong);

    @Override
    @RestResource(exported = false)
    void deleteAllById(Iterable<? extends Long> iterable);

    @Override
    @RestResource(exported = false)
    void deleteAll();

    @Override
    @RestResource(exported = false)
    void deleteAll(Iterable<? extends Note> entities);

    @Override
    @RestResource(exported = false)
    Iterable<Note> findAll(Sort sort);

    @Override
    @RestResource(exported = false)
    boolean existsById(Long aLong);

    @Override
    @RestResource(exported = false)
    Iterable<Note> findAllById(Iterable<Long> longs);

    @Override
    @RestResource(exported = false)
    long count();

}
