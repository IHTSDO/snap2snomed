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

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.snomed.snap2snomed.controller.dto.AutomapRowDto;
import org.snomed.snap2snomed.model.MapRow;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
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
public interface MapRowRepository
    extends RevisionRepository<MapRow, Long, Integer>, PagingAndSortingRepository<MapRow, Long> {

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Override
  @Query("select mr from MapRow mr where true = ?#{@authenticationFacadeImpl.isAdminUser()} "
      + "      or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} "
      + "                   and (u member of mr.map.project.owners "
      + "                        or u member of mr.map.project.members "
      + "                        or u member of mr.map.project.guests))")
  Page<MapRow> findAll(Pageable pageable);

  // authorisation handled in the event handler
  @Override
  <S extends MapRow> S save(S entity);

  // authorisation in PreAuthFilter
  @Override
  Optional<MapRow> findById(Long id);

  // used in tests
  @Query("select mr from MapRow mr where mr.map.id = :mapId "
      + " and (true = ?#{@authenticationFacadeImpl.isAdminUser()} "
      + "      or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} "
      + "                   and (u member of mr.map.project.owners "
      + "                        or u member of mr.map.project.members "
      + "                        or u member of mr.map.project.guests)))")
  List<MapRow> findMapRowsByMapId(Long mapId);

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Override
  @RestResource(exported = false)
  Iterable<MapRow> findAll(Sort sort);

  @Override
  @RestResource(exported = false)
  Iterable<MapRow> findAll();

  /* Note that the subselect in these update queries looks strange, but any form of join in an
   * update statement is not permitted outside a subselect in a where clause in JPQL */
  @Query("update MapRow mr set mr.authorTask = :task, mr.modifiedBy = :user, mr.modified = :date"
      + " where mr.map.id = :#{#task.map.id} "
      + " and mr.sourceCode.id in "
      + "  (select code.id from ImportedCode code "
      + "   where code.importedCodeSet.id = :#{#task.map.source.id} "
      + "   and code.index between :lowerEndpoint and :upperEndpoint)")
  @Modifying
  @RestResource(exported = false)
  void setAuthorTaskBySourceCodeRange(Task task, Long lowerEndpoint, Long upperEndpoint, Instant date, String user);

  @Query("update MapRow mr set mr.authorTask = :task, mr.modifiedBy = :user, mr.modified = :date "
      + " where mr.map.id = :#{#task.map.id} "
      + " and mr.sourceCode.id in "
      + "  (select code.id from ImportedCode code "
      + "   where code.importedCodeSet.id = :#{#task.map.source.id} "
      + "   and code.index in :singleIndexes)")
  @Modifying
  @RestResource(exported = false)
  void setAuthorTaskBySourceCode(Task task, Set<Long> singleIndexes, Instant date, String user);

  @Query("update MapRow mr set mr.reviewTask = :task, mr.modifiedBy = :user, mr.modified = :date "
      + " where mr.map.id = :#{#task.map.id} "
      + " and mr.sourceCode.id in "
      + "  (select code.id from ImportedCode code "
      + "   where code.importedCodeSet.id = :#{#task.map.source.id} "
      + "   and code.index between :lowerEndpoint and :upperEndpoint)")
  @Modifying
  @RestResource(exported = false)
  void setReviewTaskBySourceCodeRange(Task task, Long lowerEndpoint, Long upperEndpoint, Instant date, String user);

  @Query("update MapRow mr set mr.reviewTask = :task, mr.modifiedBy = :user, mr.modified = :date "
      + " where mr.map.id = :#{#task.map.id} "
      + " and mr.sourceCode.id in "
      + "  (select code.id from ImportedCode code "
      + "  where code.importedCodeSet.id = :#{#task.map.source.id} "
      + "  and code.index in :singleIndexes)")
  @Modifying
  @RestResource(exported = false)
  void setReviewTaskBySourceCode(Task task, Set<Long> singleIndexes, Instant date, String user);

  @Query("update MapRow mr set mr.authorTask = null, mr.modifiedBy = :user, mr.modified = :date  where mr.authorTask = :task")
  @Modifying
  @RestResource(exported = false)
  void setAuthorTaskToNull(Task task, Instant date, String user);

  @Query("update MapRow mr set mr.reviewTask = null, mr.modifiedBy = :user, mr.modified = :date  where mr.reviewTask = :task")
  @Modifying
  @RestResource(exported = false)
  void setReviewTaskToNull(Task task, Instant date, String user);

  @Query("select distinct mr.sourceCode.index from MapRow mr "
      + "where mr.reviewTask = :task or mr.authorTask = :task order by mr.sourceCode.index asc")
  @RestResource(exported = false)
  List<Long> getSourceRowIndexesForTask(Task task);

  @Query("select distinct mr.sourceCode.index from MapRow mr where (mr.authorTask = :task or mr.reviewTask = :task) and mr.status not in (:statuses)")
  @RestResource(exported = false)
  List<Long> getSourceRowIndexesForTaskNotInState(Task task, List<MapStatus> statuses);

  @Query("select new org.snomed.snap2snomed.controller.dto.AutomapRowDto(mr.id, mr.sourceCode.display) "
      + "from MapRow mr "
      + "where mr.authorTask.id = :taskId "
      + "and mr.status = org.snomed.snap2snomed.model.enumeration.MapStatus.UNMAPPED")
  @RestResource(exported = false)
  List<AutomapRowDto> findUnmappedAuthorTaskRows(Long taskId);

  @Query("select mr from MapRow mr where mr.authorTask.id = :taskId or mr.reviewTask.id = :taskId")
  @RestResource(exported = false)
  List<MapRow> findMapRowsByTaskId(Long taskId);

  @Query(value = "insert into map_row (status, map_id, source_code_id, created, created_by) select 0, :mapId, ic.id, :date, :user from imported_code ic where ic.imported_codeset_id = :sourceCodeSetId order by ic._index", nativeQuery = true)
  @Modifying
  @RestResource(exported = false)
  int createMapRows(long mapId, long sourceCodeSetId, Instant date, String user);

  /**
   * INSERT into map_row (created, created_by, modified, modified_by,
   *        no_map, status, last_author_id, `last_reviewer_id`, map_id, source_code_id)
   * SELECT :dateTime created, :user created_by, :dateTime modified, :user modified_by,
   *        no_map, status, last_author_id, `last_reviewer_id`, :mapId, source_code_id
   * FROM map_row m
   * WHERE m.map_id = :sourceMapId
   *
   */
  @Query(value = "insert into map_row (created, created_by, modified, modified_by, no_map, status, last_author_id, last_reviewer_id, map_id, source_code_id) select :dateTime, :user, :dateTime, :user, no_map, status, m.last_author_id, m.last_reviewer_id, :mapId, m.source_code_id from map_row m where m.map_id = :sourceMapId", nativeQuery = true)
  @Modifying
  @RestResource(exported = false)
  int copyMapRows(Long mapId, Long sourceMapId, String user, Instant dateTime);

  /**
   * INSERT into map_row (created, created_by, modified, modified_by,
   *        no_map, status, last_author_id, last_reviewer_id, map_id, source_code_id)
   * SELECT :dateTime created, :user created_by, :dateTime modified, :user modified_by,
   *        m.no_map, m.status, m.last_author_id, m.last_reviewer_id, :mapId, cn.id
   * FROM map_row m, imported_code cn, imported_code co
   * WHERE m.map_id = :sourceMapId
   *   AND m.source_code_id = co.id
   *   AND co.code = cn.code
   *   AND cn.imported_codeset_id = :newCodeSetId
   *
   */
  @Query(value = "insert into map_row (created, created_by, modified, modified_by, no_map, status, last_author_id, last_reviewer_id, map_id, source_code_id) select :dateTime, :user, :dateTime, :user, m.no_map, status, m.last_author_id, m.last_reviewer_id, :mapId, cn.id from map_row m, imported_code cn, imported_code co where m.map_id = :sourceMapId AND m.source_code_id = co.id AND co.code = cn.code AND cn.imported_codeset_id = :newCodeSetId", nativeQuery = true)
  @Modifying
  @RestResource(exported = false)
  int copyMapRowsForNewSource(Long mapId, Long sourceMapId, String user, Instant dateTime, Long newCodeSetId);

  /**
   * INSERT into map_row (created, created_by, status, map_id, source_code_id)
   * SELECT :dateTime created, :user created_by, 0, :mapId, c.id
   * FROM imported_code c
   * WHERE c.imported_codeset_id = :newCodeSetId AND c.id NOT IN
   *   (SELECT m.source_code_id FROM map_row m
   *    WHERE m.map_id = :mapId)
   *
   */
  @Query(value = "insert into map_row (created, created_by, status, map_id, source_code_id) select :dateTime created, :user created_by, 0, :mapId, c.id from imported_code c where c.imported_codeset_id = :newCodeSetId AND c.id NOT IN (SELECT m.source_code_id FROM map_row m WHERE m.map_id = :mapId)", nativeQuery = true)
  @Modifying
  @RestResource(exported = false)
  int createMapRowsForNewSource(Long mapId, String user, Instant dateTime, Long newCodeSetId);

  @Override
  @RestResource(exported = false)
  <S extends MapRow> Iterable<S> saveAll(Iterable<S> entities);

  @Override
  @RestResource(exported = false)
  boolean existsById(Long aLong);

  @Override
  @RestResource(exported = false)
  Iterable<MapRow> findAllById(Iterable<Long> longs);

  @Override
  @RestResource(exported = false)
  long count();

  @Override
  @RestResource(exported = false)
  void deleteById(Long aLong);

  @Override
  @RestResource(exported = false)
  void delete(MapRow entity);

  @Override
  @RestResource(exported = false)
  void deleteAllById(Iterable<? extends Long> longs);

  @Override
  @RestResource(exported = false)
  void deleteAll(Iterable<? extends MapRow> entities);

  @Override
  @RestResource(exported = false)
  void deleteAll();


}
