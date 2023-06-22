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
import java.util.ArrayList;
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
import org.snomed.snap2snomed.model.AdditionalCodeColumn;
import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.MapView;
import org.snomed.snap2snomed.model.QDbMapView;
import org.snomed.snap2snomed.model.QImportedCode;
import org.snomed.snap2snomed.model.QMapRow;
import org.snomed.snap2snomed.model.QMapRowTarget;
import org.snomed.snap2snomed.model.QNote;
import org.snomed.snap2snomed.model.QUser;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.model.enumeration.ColumnType;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.repository.DbMapViewRepository;
import org.snomed.snap2snomed.repository.MapRepository;
import org.snomed.snap2snomed.repository.TaskRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
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
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class MapViewService {

  private static final String ADDITIONAL_COLUMN_NAME = "additionalColumn";
  private static final String TARGET_OUT_OF_SCOPE_TAG = "target-out-of-scope";

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
    private final List<String> assignedReconciler;
    private final Boolean targetOutOfScope;
    private final Boolean flagged;
    private final List<String> additionalColumns;

    public MapViewFilter(List<String> sourceCodes, List<String> sourceDisplays, Boolean noMap, List<String> targetCodes,
        List<String> targetDisplays, List<MappingRelationship> relationshipTypes, List<MapStatus> statuses, 
        List<String> lastAuthor, List<String> lastReviewer, List<String> lastAuthorReviewer, 
        List<String> assignedAuthor, List<String> assignedReviewer, List<String> assignedReconciler,
        Boolean targetOutOfScope, Boolean flagged, List<String> additionalColumns) {
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
      this.assignedReconciler = assignedReconciler;
      this.targetOutOfScope = targetOutOfScope;
      this.flagged = flagged;
      this.additionalColumns  = additionalColumns;
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

      if (!CollectionUtils.isEmpty(assignedReconciler)) {
        BooleanExpression noneMatch = null;
        if (assignedReconciler.contains("none")) {
          noneMatch = QMapRow.mapRow.reconcileTask.assignee.isNull();
        }

        expression = collectAndStatement(expression, collectOrStatement(QMapRow.mapRow.reconcileTask.assignee.id.in(assignedReconciler),
            noneMatch));
      }

      if (targetOutOfScope != null) {
        if (targetOutOfScope) {
          expression = collectAndStatement(expression, QMapRowTarget.mapRowTarget.tags.contains(TARGET_OUT_OF_SCOPE_TAG));
        }
        else {
          expression = collectAndStatement(expression, QMapRowTarget.mapRowTarget.tags.contains(TARGET_OUT_OF_SCOPE_TAG).not());
        }
      }

      if (flagged != null) {
        expression = collectAndStatement(expression, QMapRowTarget.mapRowTarget.flagged.eq(flagged));
      }

      if (!CollectionUtils.isEmpty(additionalColumns)) {
        for (int i = 0; i < additionalColumns.size(); i++) {
          final String string = additionalColumns.get(i);
          if (!string.isEmpty()) {
            expression = collectAndStatement(expression, QMapRow.mapRow.sourceCode.additionalColumns.get(i).value.containsIgnoreCase(string));
          }
        }
      }

      return expression;
    }

    private BooleanExpression stringCollectionToOrStatements(BooleanExpression expression, List<String> stringCollection,
        Function<String, BooleanExpression> function, BiFunction<BooleanExpression, BooleanExpression, BooleanExpression> collector) {
      if (!CollectionUtils.isEmpty(stringCollection)) {
        BooleanExpression innerExpression = null;
        for (final String string : stringCollection) {
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

  @Autowired 
  AuthenticationFacade authenticationFacade;

  @Autowired
  DbMapViewRepository mapViewRepository;

  private final QDbMapView mapView = QDbMapView.dbMapView;
  private final QMapRow mapRow = QMapRow.mapRow;
  private final QMapRowTarget mapTarget = QMapRowTarget.mapRowTarget;
  private final QNote note = QNote.note;


  public Snap2SnomedPagedModel<EntityModel<MapView>> getMapResults(Long mapId, Pageable pageable, PagedResourcesAssembler<MapView> assembler,
      MapViewFilter filter) {
    if (!mapRepository.existsById(mapId)) {
      throw Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId);
    }

    return getMapResults(mapId, null, pageable, assembler, filter);
  }

  public Snap2SnomedPagedModel<EntityModel<MapView>> getMapResultsByTask(Long taskId, Pageable pageable, PagedResourcesAssembler<MapView> assembler,
      MapViewFilter filter) {
    final Task task = taskRepository.findById(taskId).orElseThrow(() -> Problem.valueOf(Status.NOT_FOUND, "No Task found with id " + taskId));
    if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForMapId(task.getMap().getId())) {
      throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project!");
    }
    return getMapResults(task.getMap().getId(), task, pageable, assembler, filter);
  }

  public String getFileNameForMapExport(Long mapId, String contentType) {
    final Map map = mapRepository.findById(mapId).orElseThrow(() -> Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId));
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

  public List<AdditionalCodeColumn> getAdditionalColumnsMetadata(Long mapId) {
    return mapRepository.findSourceByMapId(mapId).get().getAdditionalColumnsMetadata();
  }

  public String[] getExportHeader(Long mapId) {
    
    ArrayList<String> exportHeader = new ArrayList<String>(Arrays.asList("\uFEFF" + "Source code", "Source display"));

    final List<AdditionalCodeColumn> additionalCodeColumnList = this.getAdditionalColumnsMetadata(mapId);      
    if (additionalCodeColumnList != null && additionalCodeColumnList.size() > 0) {
      for (AdditionalCodeColumn additionalColumn : additionalCodeColumnList) {
        exportHeader.add(additionalColumn.getName());
      }
    }
    exportHeader.addAll(Arrays.asList("Target code", "Target display", "Relationship type code", "Relationship type display", "No map flag", "Status"));

    return exportHeader.toArray(new String[0]);

  }

  public List<MapView> getAllMapViewForMap(Long mapId) {
    return getQueryForMap(mapId, null, null).orderBy(mapRow.sourceCode.index.asc()).orderBy(mapTarget.id.asc()).fetch();
  }

  private  Snap2SnomedPagedModel<EntityModel<MapView>> getMapResults(Long mapId, Task task, Pageable pageable,
      PagedResourcesAssembler<MapView> assembler, MapViewFilter filter) {
    final List<AdditionalCodeColumn> additionalColumns = mapRepository.findSourceByMapId(mapId).get().getAdditionalColumnsMetadata();

    final Map map = mapRepository.findById(mapId).orElseThrow(() -> Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId));
    Boolean dualMapMode = map.getProject().getDualMapMode();

    JPAQuery<MapView> query;
    if (dualMapMode) {
      query = getDualMapQueryForMap(mapId, task, filter);
    }
    else {
      query = getQueryForMap(mapId, task, filter);
    }

    query = transformSortable(query, pageable.getSort(), additionalColumns, dualMapMode);
    query = transformPageable(query, pageable);

    final QueryResults<MapView> results = query.fetchResults();

    final JPAQuery<MappedRowDetailsDto> mappingRowDetailsQuery = getQueryMappedRowDetailsForMap(mapId, task, filter,
            pageable);
    final List<MappedRowDetailsDto> sourceIndexResults = mappingRowDetailsQuery.fetch();

    final Page<MapView> page = new PageImpl<>(results.getResults(), pageable, results.getTotal());
    final PagedModel<EntityModel<MapView>> pagedModel = assembler.toModel(page);
    final Snap2SnomedPagedModel<EntityModel<MapView>> _results = new Snap2SnomedPagedModel<>(pagedModel, sourceIndexResults, additionalColumns);
    return _results;
  }

  protected JPAQuery<MapView> transformPageable(JPAQuery<MapView> query, Pageable pageable) {
    if (pageable.isPaged()) {
      query = query.offset(pageable.getOffset()).limit(pageable.getPageSize());
    }
    return query;
  }

  protected JPAQuery<MapView> transformSortable(JPAQuery<MapView> query, Sort sort, List<AdditionalCodeColumn> additionalColumns, Boolean dualMapMode) {
    if (sort != null) {
      var _mapRow = dualMapMode ? mapView.mapRow : mapRow;

      for (final Order s : sort) {
        List<ComparableExpressionBase<?>> field;
        switch (s.getProperty()) {
          case "rowId":
            field = Arrays.asList(_mapRow.id);
            break;
          case "sourceIndex":
            field = Arrays.asList(_mapRow.sourceCode.index);
            break;
          case "sourceCode":
            field = Arrays.asList(_mapRow.sourceCode.code);
            break;
          case "sourceDisplay":
            field = Arrays.asList(_mapRow.sourceCode.display);
            break;
          case "noMap":
            field = Arrays.asList(_mapRow.noMap);
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
            field = Arrays.asList(_mapRow.status);
            break;
          case "latestNote":
            field = Arrays.asList(Expressions.dateTimePath(ZonedDateTime.class, "latestNote"));
            break;
          case "assignedAuthor":
            field = Arrays.asList(getUserSortComparison(_mapRow.authorTask.assignee));
            break;
          case "assignedReviewer":
            field = Arrays.asList(getUserSortComparison(_mapRow.reviewTask.assignee));
            break;
          case "lastAuthor":
            field = Arrays.asList(getUserSortComparison(_mapRow.lastAuthor));
            break;
          case "lastReviewer":
            field = Arrays.asList(getUserSortComparison(_mapRow.lastReviewer));
            break;
          case "lastAuthorReviewer":
            field = Arrays.asList(
                getUserSortComparison(_mapRow.lastAuthor),
                getUserSortComparison(_mapRow.lastReviewer));
            break;
          case "targetOutOfScope":
            field = null;
            // it does not make sense to sort by this flag so it is not supported
            log.warn("Unsupported MapView sort field '" + s.getProperty() + "' - ignored");
            break;
          case "flagged":
            field = Arrays.asList(mapTarget.flagged);
            break;

          default:
            if (s.getProperty().startsWith(ADDITIONAL_COLUMN_NAME)) {
              final int index = Integer.parseInt(s.getProperty().substring(ADDITIONAL_COLUMN_NAME.length())) - 1;
              final ColumnType type = additionalColumns.get(index).getType();
              field = Arrays.asList(getSortExpression(_mapRow.sourceCode, type, index));
            } else {
              field = null;
              log.warn("Unknown MapView sort field '" + s.getProperty() + "' - ignored");
            }
        }

        if (null != field) {
          for (final ComparableExpressionBase<?> f : field) {
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

  private ComparableExpressionBase<?> getSortExpression(QImportedCode code, ColumnType type, int index) {
    final StringPath value = code.additionalColumns.get(index).value;
    if (ColumnType.NUMBER.equals(type)) {
      return value.castToNum(Double.class);
    } else {
      return value;
    }
  }

  private StringExpression getUserSortComparison(QUser user) {
    return user.givenName.concat(user.familyName).concat(user.email);
  }

  protected List<?> toRepList(Stream<MapView> stream) {
    return stream.map(RepresentationModel::of).collect(Collectors.toList());
  }

  private JPAQuery<MapView> getDualMapQueryForMap(Long mapId, Task task, MapViewFilter filter) {

    if (task != null) {

      //TODO maybe two queries here removing unneeded joins?
      
      // details / task screen .. don't display reconcile state or reconciled (mapped)
      JPAQuery<MapView> query = new JPAQuery<MapView>(entityManager)
      .select(Projections.constructor(MapView.class, mapRow, mapTarget,
          ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
              .where(note.mapRow.eq(mapRow).and(note.deleted.isFalse())), "latestNote"),
              mapRow.status))
      .from(mapRow)
      .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow))
      .leftJoin(mapRow.authorTask)
      .leftJoin(mapRow.reviewTask)
      .leftJoin(mapRow.reconcileTask)
      .leftJoin(mapRow.lastAuthor)
      .leftJoin(mapRow.lastReviewer)
      .where(getWhereClause(mapId, task, filter));

      if (task.getType().equals(TaskType.RECONCILE)) {
        query = query.orderBy(mapRow.sourceCode.index.asc()).orderBy((mapRow.lastAuthor.id.asc()));
      }

      return query;
    }
    else {
      // view screen

      return new JPAQuery<MapView>(entityManager)
      .select(Projections.constructor(MapView.class, mapView.mapRow, mapTarget,
          ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
              .where(note.mapRow.eq(mapView.mapRow).and(note.deleted.isFalse())), "latestNote"),
              mapView.status, mapView.siblingRowAuthorTask))
      .from(mapView)
      .leftJoin(mapTarget).on(mapTarget.row.eq(mapView.mapRow))
      .leftJoin(mapView.mapRow.authorTask)
      .leftJoin(mapView.mapRow.reviewTask)
      .leftJoin(mapView.mapRow.reconcileTask)
      .leftJoin(mapView.mapRow.lastAuthor)
      .leftJoin(mapView.mapRow.lastReviewer)
      .leftJoin(mapView.siblingRowAuthorTask)
      .where(getMapViewWhereClause(mapId, task, filter))
      .orderBy(mapView.mapRow.sourceCode.index.asc())
      .orderBy(mapView.mapRow.lastAuthor.id.asc());
    }
  }

  protected JPAQuery<MapView> getQueryForMap(Long mapId, Task task, MapViewFilter filter) {

    return new JPAQuery<MapView>(entityManager)
        .select(Projections.constructor(MapView.class, mapRow, mapTarget,
            ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
                .where(note.mapRow.eq(mapRow).and(note.deleted.isFalse())), "latestNote")))
        .from(mapRow)
        .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow))
        .leftJoin(mapRow.authorTask)
        .leftJoin(mapRow.reviewTask)
        .leftJoin(mapRow.lastAuthor)
        .leftJoin(mapRow.lastReviewer)
        .where(getWhereClause(mapId, task, filter))
        .where(mapRow.blindMapFlag.eq(false));
  }

  protected JPAQuery<MappedRowDetailsDto> getQueryMappedRowDetailsForMap(Long mapId, Task task, MapViewFilter filter,
                                                                         Pageable pageable) {

    final JPAQuery<MappedRowDetailsDto> query = new JPAQuery<MapView>(entityManager)
            .select(Projections.constructor(MappedRowDetailsDto.class, mapRow.id, mapRow.sourceCode.index, mapTarget.id))
            .from(mapRow)
            .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow));
    if (task != null) {
      query.leftJoin(mapRow.authorTask)
           .leftJoin(mapRow.reviewTask)
           .leftJoin(mapRow.reconcileTask)
           .leftJoin(mapRow.lastAuthor)
           .leftJoin(mapRow.lastReviewer);
    }
    query.where(getWhereClause(mapId, task, filter));
    query.offset(pageable.getOffset()).limit(pageable.getPageSize());
    return query;
  }

  private BooleanExpression getMapViewWhereClause(Long mapId, Task task, MapViewFilter filter) {
    BooleanExpression whereClause = mapView.mapRow.map.id.eq(mapId);

    if (filter != null) {
      final BooleanExpression filterExpression = filter.getExpression();
      if (filterExpression != null) {
        whereClause = whereClause.and(filterExpression);
      }
    }

    return whereClause;
  }

  private BooleanExpression getWhereClause(Long mapId, Task task, MapViewFilter filter) {
    BooleanExpression whereClause = mapRow.map.id.eq(mapId);

    if (task != null) {
      if (task.getType().equals(TaskType.AUTHOR)) {
        whereClause = whereClause.and(mapRow.authorTask.eq(task));
        if (task.getMap().getProject().getDualMapMode()) {
          whereClause = whereClause.and(mapRow.blindMapFlag.eq(true));
        }
      } else if (task.getType().equals(TaskType.REVIEW)) {
        whereClause = whereClause.and(mapRow.reviewTask.eq(task));
      }
      else if (task.getType().equals(TaskType.RECONCILE)) {
        whereClause = whereClause.and(mapRow.blindMapFlag.eq(false));
        whereClause = whereClause.and(mapRow.reconcileTask.eq(task));
        whereClause = whereClause.and(mapRow.status.eq(MapStatus.RECONCILE));
      }
    }

    if (filter != null) {
      final BooleanExpression filterExpression = filter.getExpression();
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

  public MapView getDualMapSiblingRow(Long mapId, Long sourceCodeId, Long mapRowId) {

    if (!mapRepository.existsById(mapId)) {
      throw Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId);
    }

    JPAQuery<MapView> query = new JPAQuery<MapView>(entityManager)
        .select(Projections.constructor(MapView.class, mapRow, mapTarget,
            ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
                .where(note.mapRow.eq(mapRow).and(note.deleted.isFalse())), "latestNote")))
        .from(mapRow)
        .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow))
        .where(mapRow.map.id.eq(mapId))
        .where(mapRow.id.ne(mapRowId))
        .where(mapRow.sourceCode.id.eq(sourceCodeId));

    QueryResults<MapView> queryResults = query.fetchResults();
    return queryResults.getResults().get(0);

  }

}
