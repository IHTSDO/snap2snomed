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

package org.snomed.snap2snomed.service;

import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.persistence.EntityManager;

import org.snomed.snap2snomed.controller.MapViewRestController;
import org.snomed.snap2snomed.controller.dto.MappedRowDetailsDto;
import org.snomed.snap2snomed.controller.dto.Snap2SnomedPagedModel;
import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.MapView;
import org.snomed.snap2snomed.model.QMapRow;
import org.snomed.snap2snomed.model.QMapRowTarget;
import org.snomed.snap2snomed.model.QNote;
import org.snomed.snap2snomed.model.QUser;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.repository.MapRepository;
import org.snomed.snap2snomed.repository.TaskRepository;
import org.snomed.snap2snomed.security.WebSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Order;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

import com.querydsl.core.QueryResults;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.ComparableExpressionBase;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class MapViewService {

  public class MapViewFilter {

    private final List<String> sourceCodes;
    private final List<String> sourceDisplays;
    private final Boolean noMap;
    private final List<String> targetCodes;
    private final List<String> targetDisplays;
    private final List<MappingRelationship> relationshipTypes;
    private final List<MapStatus> statuses;
    private final List<String> lastAuthor;
    private final List<String> lastReviewer;
    private final List<String> lastAuthorReviewer;
    private final List<String> assignedAuthor;
    private final List<String> assignedReviewer;
    private final Boolean flagged;

    public MapViewFilter(List<String> sourceCodes, List<String> sourceDisplays, Boolean noMap, List<String> targetCodes,
        List<String> targetDisplays, List<MappingRelationship> relationshipTypes, List<MapStatus> statuses, List<String> lastAuthor,
        List<String> lastReviewer, List<String> lastAuthorReviewer, List<String> assignedAuthor, List<String> assignedReviewer,
        Boolean flagged) {
      this.sourceCodes = sourceCodes;
      this.sourceDisplays = sourceDisplays;
      this.noMap = noMap;
      this.targetCodes = targetCodes;
      this.targetDisplays = targetDisplays;
      this.relationshipTypes = relationshipTypes;
      this.statuses = statuses;
      this.lastAuthor = lastAuthor;
      this.lastReviewer = lastReviewer;
      this.lastAuthorReviewer = lastAuthorReviewer;
      this.assignedAuthor = assignedAuthor;
      this.assignedReviewer = assignedReviewer;
      this.flagged = flagged;
    }

    public BooleanExpression getExpression() {

      BooleanExpression expression = null;

      expression = stringCollectionToOrStatements(expression, sourceCodes,
          s -> QMapRow.mapRow.sourceCode.code.startsWithIgnoreCase(s),
          (a, b) -> collectOrStatement(a, b));
      expression = stringCollectionToOrStatements(expression, sourceDisplays,
          s -> QMapRow.mapRow.sourceCode.display.containsIgnoreCase(s),
          (a, b) -> collectAndStatement(a, b));

      if (noMap != null) {
        expression = collectAndStatement(expression, QMapRow.mapRow.noMap.eq(noMap));
      }

      expression = stringCollectionToOrStatements(expression, targetCodes,
          s -> QMapRowTarget.mapRowTarget.targetCode.startsWithIgnoreCase(s),
          (a, b) -> collectOrStatement(a, b));
      expression = stringCollectionToOrStatements(expression, targetDisplays,
          s -> QMapRowTarget.mapRowTarget.targetDisplay.containsIgnoreCase(s),
          (a, b) -> collectAndStatement(a, b));

      if (!CollectionUtils.isEmpty(relationshipTypes)) {
        expression = collectAndStatement(expression, QMapRowTarget.mapRowTarget.relationship.in(relationshipTypes));
      }

      if (!CollectionUtils.isEmpty(statuses)) {
        expression = collectAndStatement(expression, QMapRow.mapRow.status.in(statuses));
      }

      if (!CollectionUtils.isEmpty(lastAuthor)) {
        expression = collectAndStatement(expression, QMapRow.mapRow.lastAuthor.id.in(lastAuthor));
      }

      if (!CollectionUtils.isEmpty(lastReviewer)) {
        expression = collectAndStatement(expression, QMapRow.mapRow.lastReviewer.id.in(lastReviewer));
      }

      if (!CollectionUtils.isEmpty(lastAuthorReviewer)) {
        BooleanExpression noneMatch = null;
        if (lastAuthorReviewer.contains("none")) {
          noneMatch = QMapRow.mapRow.lastAuthor.isNull().and(QMapRow.mapRow.lastReviewer.isNull());
        }

        expression = collectAndStatement(expression,
            collectOrStatement(QMapRow.mapRow.lastAuthor.id.in(lastAuthorReviewer).or(QMapRow.mapRow.lastReviewer.id.in(lastAuthorReviewer)),
                noneMatch));
      }

      if (!CollectionUtils.isEmpty(assignedAuthor)) {
        BooleanExpression noneMatch = null;
        if (assignedAuthor.contains("none")) {
          noneMatch = QMapRow.mapRow.authorTask.isNull();
        }

        expression = collectAndStatement(expression, collectOrStatement(QMapRow.mapRow.authorTask.assignee.id.in(assignedAuthor),
            noneMatch));
      }

      if (!CollectionUtils.isEmpty(assignedReviewer)) {
        BooleanExpression noneMatch = null;
        if (assignedReviewer.contains("none")) {
          noneMatch = QMapRow.mapRow.reviewTask.assignee.isNull();
        }

        expression = collectAndStatement(expression, collectOrStatement(QMapRow.mapRow.reviewTask.assignee.id.in(assignedReviewer),
            noneMatch));
      }

      if (flagged != null) {
        expression = collectAndStatement(expression, QMapRowTarget.mapRowTarget.flagged.eq(flagged));
      }

      return expression;
    }

    private BooleanExpression stringCollectionToOrStatements(BooleanExpression expression, List<String> stringCollection,
        Function<String, BooleanExpression> function, BiFunction<BooleanExpression, BooleanExpression, BooleanExpression> collector) {
      if (!CollectionUtils.isEmpty(stringCollection)) {
        BooleanExpression innerExpression = null;
        for (String string : stringCollection) {
          innerExpression = collector.apply(innerExpression, function.apply(string));
        }
        return collectAndStatement(expression, innerExpression);
      }

      return expression;
    }
  }

  @Autowired
  EntityManager entityManager;

  @Autowired
  TaskRepository taskRepository;

  @Autowired
  MapRepository mapRepository;

  @Autowired
  WebSecurity webSecurity;  

  private QMapRow mapRow = QMapRow.mapRow;
  private QMapRowTarget mapTarget = QMapRowTarget.mapRowTarget;
  private QNote note = QNote.note;


  public Snap2SnomedPagedModel<EntityModel<MapView>> getMapResults(Long mapId, Pageable pageable, PagedResourcesAssembler<MapView> assembler,
      MapViewFilter filter) {
    if (!mapRepository.existsById(mapId)) {
      throw Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId);
    }

    return getMapResults(mapId, null, pageable, assembler, filter);
  }

  public Snap2SnomedPagedModel<EntityModel<MapView>> getMapResultsByTask(Long taskId, Pageable pageable, PagedResourcesAssembler<MapView> assembler,
      MapViewFilter filter) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> Problem.valueOf(Status.NOT_FOUND, "No Task found with id " + taskId));
    if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForMapId(task.getMap().getId())) {
      throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project!");
    }
    return getMapResults(task.getMap().getId(), task, pageable, assembler, filter);
  }

  public String getFileNameForMapExport(Long mapId, String contentType) {
    Map map = mapRepository.findById(mapId).orElseThrow(() -> Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId));
    String extension;
    switch (contentType) {
      case MapViewRestController.TEXT_TSV:
        extension = ".tsv";
        break;

      case MapViewRestController.TEXT_CSV:
        extension = ".csv";
        break;

      case MapViewRestController.APPLICATION_XSLX:
        extension = ".xlsx";
        break;

      default:
        throw Problem.valueOf(Status.UNSUPPORTED_MEDIA_TYPE, "Content type " + contentType + " is not supported");
    }

    return "map-" + map.getProject().getTitle() + "_" + map.getMapVersion() + extension;
  }

  public List<MapView> getAllMapViewForMap(Long mapId) {
    return getQueryForMap(mapId, null, null).orderBy(mapRow.sourceCode.index.asc()).orderBy(mapTarget.id.asc()).fetch();
  }

  private  Snap2SnomedPagedModel<EntityModel<MapView>> getMapResults(Long mapId, Task task, Pageable pageable,
      PagedResourcesAssembler<MapView> assembler, MapViewFilter filter) {
    JPAQuery<MapView> query = getQueryForMap(mapId, task, filter);
    query = transformSortable(query, pageable.getSort());
    query = transformPageable(query, pageable);

    QueryResults<MapView> results = query.fetchResults();

    JPAQuery<MappedRowDetailsDto> mappingRowDetailsQuery = getQueryMappedRowDetailsForMap(mapId, task, filter);
    QueryResults<MappedRowDetailsDto> sourceIndexResults = mappingRowDetailsQuery.fetchResults();

    Page<MapView> page = new PageImpl<>(results.getResults(), pageable, results.getTotal());
    PagedModel<EntityModel<MapView>> pagedModel = assembler.toModel(page);
    Snap2SnomedPagedModel<EntityModel<MapView>> _results = new Snap2SnomedPagedModel<>(pagedModel, sourceIndexResults.getResults());
    return _results;
  }

  protected JPAQuery<MapView> transformPageable(JPAQuery<MapView> query, Pageable pageable) {
    if (pageable.isPaged()) {
      query = query.offset(pageable.getOffset()).limit(pageable.getPageSize());
    }
    return query;
  }

  protected JPAQuery<MapView> transformSortable(JPAQuery<MapView> query, Sort sort) {
    if (sort != null) {
      for (Order s : sort) {
        List<ComparableExpressionBase<?>> field;
        switch (s.getProperty()) {
          case "rowId":
            field = Arrays.asList(mapRow.id);
            break;
          case "sourceIndex":
            field = Arrays.asList(mapRow.sourceCode.index);
            break;
          case "sourceCode":
            field = Arrays.asList(mapRow.sourceCode.code);
            break;
          case "sourceDisplay":
            field = Arrays.asList(mapRow.sourceCode.display);
            break;
          case "noMap":
            field = Arrays.asList(mapRow.noMap);
            break;
          case "targetId":
            field = Arrays.asList(mapTarget.id);
            break;
          case "targetCode":
            field = Arrays.asList(mapTarget.targetCode);
            break;
          case "targetDisplay":
            field = Arrays.asList(mapTarget.targetDisplay);
            break;
          case "relationship":
            field = Arrays.asList(mapTarget.relationship);
            break;
          case "status":
            field = Arrays.asList(mapRow.status);
            break;
          case "latestNote":
            field = Arrays.asList(Expressions.dateTimePath(ZonedDateTime.class, "latestNote"));
            break;
          case "assignedAuthor":
            field = Arrays.asList(getUserSortComparison(mapRow.authorTask.assignee));
            break;
          case "assignedReviewer":
            field = Arrays.asList(getUserSortComparison(mapRow.reviewTask.assignee));
            break;
          case "lastAuthor":
            field = Arrays.asList(getUserSortComparison(mapRow.lastAuthor));
            break;
          case "lastReviewer":
            field = Arrays.asList(getUserSortComparison(mapRow.lastReviewer));
            break;
          case "lastAuthorReviewer":
            field = Arrays.asList(
                getUserSortComparison(mapRow.lastAuthor),
                getUserSortComparison(mapRow.lastReviewer));
            break;
          case "flagged":
            field = Arrays.asList(mapTarget.flagged);
            break;

          default:
            field = null;
            log.warn("Unknown MapView sort field '" + s.getProperty() + "' - ignored");
        }

        if (null != field) {
          for (ComparableExpressionBase<?> f : field) {
            if (s.isAscending()) {
              query = query.orderBy(f.asc());
            } else {
              query = query.orderBy(f.desc());
            }
          }
        }
      }
    }
    return query;
  }

  private StringExpression getUserSortComparison(QUser user) {
    return user.givenName.concat(user.familyName).concat(user.email);
  }

  protected List<?> toRepList(Stream<MapView> stream) {
    return stream.map(RepresentationModel::of).collect(Collectors.toList());
  }

  protected JPAQuery<MapView> getQueryForMap(Long mapId, Task task, MapViewFilter filter) {

    return new JPAQuery<MapView>(entityManager)
        .select(Projections.constructor(MapView.class, mapRow, mapTarget,
            ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
                .where(note.mapRow.eq(mapRow)), "latestNote")))
        .from(mapRow)
        .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow))
        .leftJoin(mapRow.authorTask)
        .leftJoin(mapRow.reviewTask)
        .leftJoin(mapRow.lastAuthor)
        .leftJoin(mapRow.lastReviewer)
        .where(getWhereClause(mapId, task, filter));
  }

  protected JPAQuery<MappedRowDetailsDto> getQueryMappedRowDetailsForMap(Long mapId, Task task, MapViewFilter filter) {

    return new JPAQuery<MapView>(entityManager)
        .select(Projections.constructor(MappedRowDetailsDto.class, mapRow.id, mapRow.sourceCode.index, mapTarget.id))
        .from(mapRow)
        .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow))
        .leftJoin(mapRow.authorTask)
        .leftJoin(mapRow.reviewTask)
        .leftJoin(mapRow.lastAuthor)
        .leftJoin(mapRow.lastReviewer)
        .where(getWhereClause(mapId, task, filter));
  }

  private BooleanExpression getWhereClause(Long mapId, Task task, MapViewFilter filter) {
    BooleanExpression whereClause = mapRow.map.id.eq(mapId);

    if (task != null) {
      if (task.getType().equals(TaskType.AUTHOR)) {
        whereClause = whereClause.and(mapRow.authorTask.eq(task));
      } else {
        whereClause = whereClause.and(mapRow.reviewTask.eq(task));
      }
    }

    if (filter != null) {
      BooleanExpression filterExpression = filter.getExpression();
      if (filterExpression != null) {
        whereClause = whereClause.and(filterExpression);
      }
    }

    return whereClause;
  }

  private BooleanExpression collectOrStatement(BooleanExpression expression, BooleanExpression betweenStatement) {
    if (expression == null) {
      return betweenStatement;
    }
    return expression.or(betweenStatement);
  }

  private BooleanExpression collectAndStatement(BooleanExpression expression, BooleanExpression betweenStatement) {
    if (expression == null) {
      return betweenStatement;
    }
    return expression.and(betweenStatement);
  }

}
