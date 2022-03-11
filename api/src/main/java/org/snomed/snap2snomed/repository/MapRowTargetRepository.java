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

import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.SimpleExpression;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.core.types.dsl.StringPath;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import org.snomed.snap2snomed.model.ImportedCode;
import org.snomed.snap2snomed.model.MapRow;
import org.snomed.snap2snomed.model.MapRowTarget;
import org.snomed.snap2snomed.model.QImportedCode;
import org.snomed.snap2snomed.model.QMapRowTarget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.querydsl.binding.QuerydslBinderCustomizer;
import org.springframework.data.querydsl.binding.QuerydslBindings;
import org.springframework.data.querydsl.binding.SingleValueBinding;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.core.annotation.RestResource;
import org.springframework.security.access.prepost.PostFilter;

// @ PreAuthorize("isValidUser()")
@RepositoryRestResource
public interface MapRowTargetRepository
    extends RevisionRepository<MapRowTarget, Long, Integer>, CrudRepository<MapRowTarget, Long>,
    QuerydslPredicateExecutor<MapRowTarget>, QuerydslBinderCustomizer<QMapRowTarget> {

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  // authorisation in event handler
  void deleteAllByRow(MapRow row);

  @RestResource(exported = false)
  List<MapRowTarget> findByRow(MapRow row);

  @Query("select mrt from MapRowTarget mrt "
      + " where mrt.row.map.id = :mapId "
      + " and (true = ?#{@authenticationFacadeImpl.isAdminUser()} "
      + "      or exists (select 1 from User u "
      + "                 where u.id = ?#{@authenticationFacadeImpl.principalSubject} "
      + "                 and (u member of mrt.row.map.project.owners "
      + "                      or u member of mrt.row.map.project.members "
      + "                      or u member of mrt.row.map.project.guests)))")
  List<MapRowTarget> findByMapId(Long mapId);

  @Override
  @Query("select mrt from MapRowTarget mrt join MapRow mr on mr.id = mrt.row.id where true = ?#{@authenticationFacadeImpl.isAdminUser()} or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} and (u member of mr.map.project.owners or u member of mr.map.project.members or u member of mr.map.project.guests))")
  Iterable<MapRowTarget> findAll();

  // authorisation in event handler
  @Override
  void deleteById(Long id);

  // authorisation in event handler
  @Override
  <S extends MapRowTarget> S save(S entity);

  // authorisation in event handler
  @Override
  <S extends MapRowTarget> Iterable<S> saveAll(Iterable<S> entities);

  // authorisation in event handler
  @Override
  void delete(MapRowTarget entity);

  // authorisation in event handler
  @Override
  void deleteAllById(Iterable<? extends Long> longs);

  // authorisation in event handler
  @Override
  void deleteAll(Iterable<? extends MapRowTarget> entities);

  // authorisation in event handler
  @Override
  void deleteAll();

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Query(value = "insert into map_row_target (created, created_by, modified, modified_by, flagged, relationship, target_code, target_display, row_id) select :dateTime created, :user created_by, :dateTime modified, :user modified_by, false, s.relationship, s.target_code, s.target_display, tr.id row_id from map_row_target s, map_row sr, map_row tr where (s.row_id = sr.id) and (sr.map_id = :sourceMapId) and (tr.map_id = :mapId) and (sr.source_code_id = tr.source_code_id)", nativeQuery = true)
  @Modifying
  @RestResource(exported = false)
  int copyMapRowTargets(Long mapId, Long sourceMapId, String user, Instant dateTime);

  @Query(value = "insert into map_row_target " +
          "(created, created_by, modified, modified_by, flagged, relationship, target_code, " +
          "target_display, row_id) " +
          "select :dateTime created, :user created_by, :dateTime modified, :user modified_by, " +
          "false, s.relationship, s.target_code, s.target_display, tr.id row_id from map_row_target s, " +
          "map_row sr, map_row tr, imported_code sc, imported_code tc where (s.row_id = sr.id) " +
          "and (sr.map_id = :sourceMapId) and (tr.map_id = :mapId) and (sr.source_code_id = sc.id) " +
          "and (sc.code = tc.code) and (tr.source_code_id = tc.id)", nativeQuery = true)
  @Modifying
  @RestResource(exported = false)
  int copyMapRowTargetsForNewSource(Long mapId, Long sourceMapId, String user, Instant dateTime);

  @Override
  @RestResource(exported = false)
  @PostFilter("isAdminUser() || hasAnyProjectRoleForMapId(filterObject.row.map.id)")
  Iterable<MapRowTarget> findAllById(Iterable<Long> longs);

  @Override
  @RestResource(exported = false)
  Optional<MapRowTarget> findById(Long aLong);

  @Override
  @RestResource(exported = false)
  boolean existsById(Long aLong);

  @Override
  @RestResource(exported = false)
  long count();

  @Query(value = "update map_row_target mt set mt.flagged = true, mt.modified = :dateTime, mt.modified_by = :user " +
          " where mt.id in (:ids)", nativeQuery = true)
  @Modifying
  @RestResource(exported = false)
  int flagMapTargets(List<Long> ids, String user, Instant dateTime);

  // Query DSL is used internally, don't want to expose it externally because we'd need to secure it
  // hence disable following methods

  @Override
  default public void customize(QuerydslBindings bindings, QMapRowTarget root) {
    bindings.bind(String.class).first((SingleValueBinding<StringPath, String>) StringExpression::containsIgnoreCase);
    bindings.bind(root.row.sourceCode).first((SingleValueBinding<QImportedCode, ImportedCode>) SimpleExpression::eq);
  }

  @Override
  @RestResource(exported = false)
  Optional<MapRowTarget> findOne(Predicate predicate);

  @Override
  @RestResource(exported = false)
  Iterable<MapRowTarget> findAll(Predicate predicate);

  @Override
  @RestResource(exported = false)
  Iterable<MapRowTarget> findAll(Predicate predicate, Sort sort);

  @Override
  @RestResource(exported = false)
  Iterable<MapRowTarget> findAll(Predicate predicate, OrderSpecifier<?>... orders);

  @Override
  @RestResource(exported = false)
  Iterable<MapRowTarget> findAll(OrderSpecifier<?>... orders);

  @Override
  @RestResource(exported = false)
  Page<MapRowTarget> findAll(Predicate predicate, Pageable pageable);

  @Override
  @RestResource(exported = false)
  long count(Predicate predicate);

  @Override
  @RestResource(exported = false)
  boolean exists(Predicate predicate);

  @Override
  @RestResource(exported = false)
  <S extends MapRowTarget, R> R findBy(Predicate predicate, Function<FetchableFluentQuery<S>, R> queryFunction);
}
