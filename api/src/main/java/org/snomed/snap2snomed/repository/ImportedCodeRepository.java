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
import java.util.function.Function;
import org.snomed.snap2snomed.model.ImportedCode;
import org.snomed.snap2snomed.model.ImportedCodeSet;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.core.annotation.RestResource;

@RepositoryRestResource
public interface ImportedCodeRepository extends JpaRepository<ImportedCode, Long> {

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Query("select ic from ImportedCode ic left join ImportedCodeSet ics on ic.importedCodeSet.id = ics.id left join Map m on m.source.id = ics.id where ic.importedCodeSet = :importedCodeSet and (ics.createdBy = ?#{@authenticationFacadeImpl.principalSubject} or true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of m.project.owners or u member of m.project.members or u member of m.project.guests)))")
  List<ImportedCode> findByImportedCodeSet(ImportedCodeSet importedCodeSet);

  @Override
  Optional<ImportedCode> findById(Long aLong);

  @Override
  ImportedCode getOne(Long aLong);

  @Override
  ImportedCode getById(Long aLong);

  // ---------------------------------
  // NOT exported in REST interface
  // ---------------------------------

  @Override
  @RestResource(exported = false)
  Page<ImportedCode> findAll(Pageable pageable);

  @Override
  @RestResource(exported = false)
  <S extends ImportedCode> Optional<S> findOne(Example<S> example);

  @Override
  @RestResource(exported = false)
  <S extends ImportedCode> Page<S> findAll(Example<S> example, Pageable pageable);

  @Override
  @RestResource(exported = false)
  <S extends ImportedCode> long count(Example<S> example);

  @Override
  @RestResource(exported = false)
  <S extends ImportedCode> boolean exists(Example<S> example);

  @Override
  @RestResource(exported = false)
  <S extends ImportedCode, R> R findBy(Example<S> example, Function<FetchableFluentQuery<S>, R> queryFunction);

  @RestResource(exported = false)
  @Query("select max(c.index) from ImportedCode c where c.importedCodeSet = :source")
  Long findLargestSourceIndexForCodeSet(ImportedCodeSet source);

  @RestResource(exported = false)
  @Override
  List<ImportedCode> findAll();

  @RestResource(exported = false)
  @Override
  List<ImportedCode> findAll(Sort sort);

  @RestResource(exported = false)
  @Override
  List<ImportedCode> findAllById(Iterable<Long> longs);

  @RestResource(exported = false)
  @Override
  <S extends ImportedCode> List<S> findAll(Example<S> example);

  @RestResource(exported = false)
  @Override
  <S extends ImportedCode> List<S> findAll(Example<S> example, Sort sort);

  //
  // POST, PUT, PATCH, DELETE are all disabled in the RepositoryConfiguration
  //
  // methods below are not available in the REST interface, disabled to ensure
  // Swagger is generated correctly. ImportedCodes are only modified by code set import features

  @RestResource(exported = false)
  @Override
  <S extends ImportedCode> List<S> saveAll(Iterable<S> entities);

  @RestResource(exported = false)
  @Override
  <S extends ImportedCode> S saveAndFlush(S entity);

  @RestResource(exported = false)
  @Override
  <S extends ImportedCode> List<S> saveAllAndFlush(Iterable<S> entities);

  @RestResource(exported = false)
  @Override
  default void deleteInBatch(Iterable<ImportedCode> entities) {
    JpaRepository.super.deleteInBatch(entities);
  }

  @RestResource(exported = false)
  @Override
  void deleteAllInBatch(Iterable<ImportedCode> entities);

  @RestResource(exported = false)
  @Override
  void deleteAllByIdInBatch(Iterable<Long> longs);

  @RestResource(exported = false)
  @Override
  void deleteAllInBatch();

  @RestResource(exported = false)
  @Override
  <S extends ImportedCode> S save(S entity);

  @RestResource(exported = false)
  @Override
  boolean existsById(Long aLong);

  @RestResource(exported = false)
  @Override
  long count();

  @RestResource(exported = false)
  @Override
  void deleteById(Long aLong);

  @RestResource(exported = false)
  @Override
  void delete(ImportedCode entity);

  @RestResource(exported = false)
  @Override
  void deleteAllById(Iterable<? extends Long> longs);

  @RestResource(exported = false)
  @Override
  void deleteAll(Iterable<? extends ImportedCode> entities);

  @RestResource(exported = false)
  @Override
  void deleteAll();

}
