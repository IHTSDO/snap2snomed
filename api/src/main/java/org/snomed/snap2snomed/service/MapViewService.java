/*
 * Copyright © 2022-23 SNOMED International
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

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.persistence.EntityManager;
import javax.persistence.Query;

import org.snomed.snap2snomed.controller.MapViewRestController;
import org.snomed.snap2snomed.controller.dto.MappedRowDetailsDto;
import org.snomed.snap2snomed.controller.dto.Snap2SnomedPagedModel;
import org.snomed.snap2snomed.model.AdditionalCodeColumn;
import org.snomed.snap2snomed.model.DbMapView;
import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.MapRow;
import org.snomed.snap2snomed.model.MapRowTarget;
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
import org.snomed.snap2snomed.model.enumeration.NoteCategory;
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

    public BooleanExpression getExpression(boolean useDualView) {
      var _mapRow = useDualView ? QDbMapView.dbMapView.mapRow : QMapRow.mapRow;

      BooleanExpression expression = null;
        
      expression = stringCollectionToOrStatements(expression, sourceCodes,
          s -> _mapRow.sourceCode.code.startsWithIgnoreCase(s),
          (a, b) -> collectOrStatement(a, b));
      expression = stringCollectionToOrStatements(expression, sourceDisplays,
          s -> _mapRow.sourceCode.display.containsIgnoreCase(s),
          (a, b) -> collectAndStatement(a, b));

      if (noMap != null) {
        expression = collectAndStatement(expression, _mapRow.noMap.eq(noMap));
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
        expression = collectAndStatement(expression, _mapRow.status.in(statuses));
      }

      if (!CollectionUtils.isEmpty(lastAuthor)) {
        expression = collectAndStatement(expression, _mapRow.lastAuthor.id.in(lastAuthor));
      }

      if (!CollectionUtils.isEmpty(lastReviewer)) {
        expression = collectAndStatement(expression, _mapRow.lastReviewer.id.in(lastReviewer));
      }

      if (!CollectionUtils.isEmpty(lastAuthorReviewer)) {
        BooleanExpression noneMatch = null;
        if (lastAuthorReviewer.contains("none")) {
          noneMatch = _mapRow.lastAuthor.isNull().and(_mapRow.lastReviewer.isNull());
        }

        expression = collectAndStatement(expression,
            collectOrStatement(_mapRow.lastAuthor.id.in(lastAuthorReviewer).or(_mapRow.lastReviewer.id.in(lastAuthorReviewer)),
                noneMatch));
      }

      if (!CollectionUtils.isEmpty(assignedAuthor)) {
        BooleanExpression noneMatch = null;
        if (assignedAuthor.contains("none")) {
          noneMatch = _mapRow.authorTask.isNull();
        }

        expression = collectAndStatement(expression, collectOrStatement(_mapRow.authorTask.assignee.id.in(assignedAuthor),
            noneMatch));
      }

      if (!CollectionUtils.isEmpty(assignedReviewer)) {
        BooleanExpression noneMatch = null;
        if (assignedReviewer.contains("none")) {
          noneMatch = _mapRow.reviewTask.assignee.isNull();
        }

        expression = collectAndStatement(expression, collectOrStatement(_mapRow.reviewTask.assignee.id.in(assignedReviewer),
            noneMatch));
      }

      if (!CollectionUtils.isEmpty(assignedReconciler)) {
        BooleanExpression noneMatch = null;
        if (assignedReconciler.contains("none")) {
          noneMatch = _mapRow.reconcileTask.assignee.isNull();
        }

        expression = collectAndStatement(expression, collectOrStatement(_mapRow.reconcileTask.assignee.id.in(assignedReconciler),
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
            expression = collectAndStatement(expression, _mapRow.sourceCode.additionalColumns.get(i).value.containsIgnoreCase(string));
          }
        }
      }

      return expression;
    }

    private String getInListExpression(List<String> stringList) {
      return "IN (" + "'" + String.join("', '", stringList) + "'" + ") ";
    }

    public String getNativeExpression(boolean useDualView) {

      String expression = null;
        
      expression = stringCollectionToNativeQueryOrStatements(expression, sourceCodes,
          s -> " importedco14_.code LIKE '" + s + "%' ",
          (a, b) -> collectNativeQueryOrStatement(a, b));
      expression = stringCollectionToNativeQueryOrStatements(expression, sourceDisplays,
          s -> " importedco14_.display LIKE '%" + s + "%' ",
          (a, b) -> collectNativeQueryAndStatement(a, b));

      if (noMap != null) {
        expression = collectNativeQueryAndStatement(expression, " maprow15_.no_map = " + noMap);
      }

      expression = stringCollectionToNativeQueryOrStatements(expression, targetCodes,
          s -> " maprowtarg1_.target_code LIKE '" + s + "%' ",
          (a, b) -> collectNativeQueryOrStatement(a, b));
      expression = stringCollectionToNativeQueryOrStatements(expression, targetDisplays,
          s -> " maprowtarg1_.target_display LIKE '%" + s + "%' ",
          (a, b) -> collectNativeQueryAndStatement(a, b));

      if (!CollectionUtils.isEmpty(relationshipTypes)) {
        List<String> stringRelationshipTypes = relationshipTypes.stream()
          .map(rel -> Integer.toString(rel.ordinal()))
          .collect(Collectors.toList());
        expression = collectNativeQueryAndStatement(expression, " maprowtarg1_.relationship " + getInListExpression(stringRelationshipTypes));
      }

      if (!CollectionUtils.isEmpty(statuses)) {
        List<String> stringStatuses = statuses.stream()
          .map(status -> Integer.toString(status.ordinal()))
          .collect(Collectors.toList());
        expression = collectNativeQueryAndStatement(expression, " maprow15_.status " + getInListExpression(stringStatuses));
      }

      if (!CollectionUtils.isEmpty(lastAuthor)) {
        expression = collectNativeQueryAndStatement(expression, " maprow15_.`last_author_id` " + getInListExpression(lastAuthor));
      }

      if (!CollectionUtils.isEmpty(lastReviewer)) {
        expression = collectNativeQueryAndStatement(expression, " maprow15_.`last_reviewer_id` " +  getInListExpression(lastReviewer));
      }

      if (!CollectionUtils.isEmpty(lastAuthorReviewer)) {
        String noneMatch = null;
        if (lastAuthorReviewer.contains("none")) {
          noneMatch = " maprow15_.`last_author_id` IS NULL AND maprow15_.`last_reviewer_id` IS NULL ";
        }

        expression = collectNativeQueryAndStatement(expression,
            collectNativeQueryOrStatement(" maprow15_.`last_author_id` " +  getInListExpression(lastAuthorReviewer) +
            " OR maprow15_.`last_reviewer_id` " + getInListExpression(lastAuthorReviewer),
                noneMatch));
      }

      if (!CollectionUtils.isEmpty(assignedAuthor)) {
        String noneMatch = null;
        if (assignedAuthor.contains("none")) {
          noneMatch = " assigned_author_user.id IS NULL ";
        }

        //TODO assigned author not picking up second author .. existing issue not caused by this code
        expression = collectNativeQueryAndStatement(expression, 
            collectNativeQueryOrStatement(" assigned_author_user.id " + getInListExpression(assignedAuthor), 
            noneMatch));
      }

      if (!CollectionUtils.isEmpty(assignedReviewer)) {
        String noneMatch = null;
        if (assignedReviewer.contains("none")) {
          noneMatch = " assigned_reviewer_user.id IS NULL ";
        }

        expression = collectNativeQueryAndStatement(expression, 
            collectNativeQueryOrStatement(" assigned_reviewer_user.id " + getInListExpression(assignedReviewer),
            noneMatch));
      }

      if (!CollectionUtils.isEmpty(assignedReconciler)) {
        String noneMatch = null;
        if (assignedReconciler.contains("none")) {
          noneMatch = " assigned_reconciler_user.id IS NULL";
        }

        expression = collectNativeQueryAndStatement(expression, 
            collectNativeQueryOrStatement(" assigned_reconciler_user.id " + getInListExpression(assignedReconciler),
            noneMatch));
      }

      if (targetOutOfScope != null) {
        if (targetOutOfScope) {
          expression = collectNativeQueryAndStatement(expression, 
            " ('target-out-of-scope' IN (select tags7_.tags from map_row_target_tags tags7_ where maprowtarg1_.id=tags7_.map_row_target_id)) ");
        }
        else {
          expression = collectNativeQueryAndStatement(expression, " ('target-out-of-scope' NOT IN (select tags7_.tags from map_row_target_tags tags7_ where maprowtarg1_.id=tags7_.map_row_target_id)) ");
        }
      }


      if (flagged != null) {
        String flagMatch = null;
        if (flagged == false) {
          flagMatch = " maprowtarg1_.flagged IS NULL ";
        }

        expression = collectNativeQueryAndStatement(expression, 
            collectNativeQueryOrStatement(" maprowtarg1_.flagged = " + flagged + " ", flagMatch)); 
      }

      if (!CollectionUtils.isEmpty(additionalColumns)) {
        for (int i = 0; i < additionalColumns.size(); i++) {
          final String string = additionalColumns.get(i);
          if (!string.isEmpty()) {
            expression = collectNativeQueryAndStatement(expression, " additionalColumn" + (i+1)  + ".value LIKE '%" + string + "%' ");
          }
        }
      }

      return expression;
    }

    private String stringCollectionToNativeQueryOrStatements(String expression, List<String> stringCollection,
        Function<String, String> function, BiFunction<String, String, String> collector) {
      if (!CollectionUtils.isEmpty(stringCollection)) {
        String innerExpression = null;
        for (final String string : stringCollection) {
          innerExpression = collector.apply(innerExpression, function.apply(string));
        }
        return collectNativeQueryAndStatement(expression, innerExpression);
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

      case MapViewRestController.FHIR_JSON:
        extension = ".json";
        break;

      default:
        throw Problem.valueOf(Status.UNSUPPORTED_MEDIA_TYPE, "Content type " + contentType + " is not supported for map export");
    }

    return "map-" + map.getProject().getTitle() + "_" + map.getMapVersion() + extension;
  }

  public List<AdditionalCodeColumn> getAdditionalColumnsMetadata(Long mapId) {
    return mapRepository.findSourceByMapId(mapId).get().getAdditionalColumnsMetadata();
  }

  public String[] getExportHeader(Long mapId, List<String> extraColumns) {
    
    ArrayList<String> exportHeader = new ArrayList<String>(Arrays.asList("\ufeff" + "Source code", "Source display"));

    final List<AdditionalCodeColumn> additionalCodeColumnList = this.getAdditionalColumnsMetadata(mapId);
    if (additionalCodeColumnList != null && additionalCodeColumnList.size() > 0) {
      for (AdditionalCodeColumn additionalColumn : additionalCodeColumnList) {
        exportHeader.add(additionalColumn.getName());
      }
    }
    exportHeader.addAll(Arrays.asList("Target code", "Target display", "Relationship type code", "Relationship type display", "No map flag", "Status"));

    if (extraColumns != null) {
      for (String extraColumn : extraColumns) {
        switch(extraColumn.toUpperCase()) {
          case "NOTES":
            exportHeader.add("Notes");
            break;
          case "ASSIGNEDAUTHOR":
            exportHeader.add("Assigned author");
            break;
          case "ASSIGNEDREVIEWER":
            exportHeader.add("Assigned reviewer");
            break;
          case "LASTAUTHOR":
            exportHeader.add("Last author");
            break;
          case "LASTREVIEWER":
            exportHeader.add("Last reviewer");
            break;
        }
      }
    }

    return exportHeader.toArray(new String[0]);

  }

  public List<MapView> getAllMapViewForMap(Long mapId) {
    final Map map = mapRepository.findById(mapId).orElseThrow(() -> Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId));
    Boolean dualMapMode = map.getProject().getDualMapMode();
    if (dualMapMode) {
      return getDualMapQueryForMap(mapId, null, null, null).fetch();
    }
    else {
      return getQueryForMap(mapId, null, null).orderBy(mapRow.sourceCode.index.asc()).orderBy(mapTarget.id.asc()).fetch();
    }
    
  }

  private Snap2SnomedPagedModel<EntityModel<MapView>> getMapResults(Long mapId, Task task, Pageable pageable,
      PagedResourcesAssembler<MapView> assembler, MapViewFilter filter) {
    final List<AdditionalCodeColumn> additionalColumns = mapRepository.findSourceByMapId(mapId).get()
        .getAdditionalColumnsMetadata();

    final Map map = mapRepository.findById(mapId)
        .orElseThrow(() -> Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId));
    Boolean dualMapMode = map.getProject().getDualMapMode();

    if (dualMapMode && task == null) {

      StringBuilder queryStrBuilder = new StringBuilder("select map_view.map_row_id as col_0_0_, maprowtarg1_.id as col_1_0_, (select max(note18_.modified) from note note18_ where note18_.maprow_id=map_view.map_row_id and note18_.category=0 and note18_.deleted=0) as col_2_0_, map_view.status as col_3_0_, map_view.sibling_row_author_task_id as col_4_0_, maprow15_.id as id1_13_0_, maprowtarg1_.id as id1_9_1_, task12_.id as id1_26_2_, maprow15_.author_task_id as author_t9_13_0_, maprow15_.blind_map_flag as blind_ma2_13_0_, maprow15_.created as created3_13_0_, maprow15_.created_by as created_4_13_0_, maprow15_.`last_author_id` as last_au10_13_0_, maprow15_.`last_reviewer_id` as last_re11_13_0_, maprow15_.map_id as map_id12_13_0_, maprow15_.modified as modified5_13_0_, maprow15_.modified_by as modified6_13_0_, maprow15_.no_map as no_map7_13_0_, maprow15_.reconcile_task_id as reconci13_13_0_, maprow15_.review_task_id as review_14_13_0_, maprow15_.source_code_id as source_15_13_0_, maprow15_.status as status8_13_0_, maprowtarg1_.created as created2_9_1_, maprowtarg1_.created_by as created_3_9_1_, maprowtarg1_.flagged as flagged4_9_1_, maprowtarg1_.`last_author_id` as last_au10_9_1_, maprowtarg1_.modified as modified5_9_1_, maprowtarg1_.modified_by as modified6_9_1_, maprowtarg1_.relationship as relation7_9_1_, maprowtarg1_.row_id as row_id11_9_1_, maprowtarg1_.target_code as target_c8_9_1_, maprowtarg1_.target_display as target_d9_9_1_, task12_.`assignee_id` as assignee8_26_2_, task12_.created as created2_26_2_, task12_.created_by as created_3_26_2_, task12_.description as descript4_26_2_, task12_.map_id as map_id9_26_2_, task12_.modified as modified5_26_2_, task12_.modified_by as modified6_26_2_, task12_.type as type7_26_2_, ");
      queryStrBuilder.append("assigned_author_user.family_name as assigned_author_family_name, ");
      queryStrBuilder.append("assigned_author_user.given_name as assigned_author_given_name, ");
      queryStrBuilder.append("assigned_author_user.email as assigned_author_email, ");
      queryStrBuilder.append("assigned_reviewer_user.family_name as assigned_reviewer_family_name, ");
      queryStrBuilder.append("assigned_reviewer_user.given_name as assigned_reviewer_given_name, ");
      queryStrBuilder.append("assigned_reviewer_user.email as assigned_reviewer_email, ");
      queryStrBuilder.append("assigned_reconciler_user.family_name as assigned_reconciler_family_name, ");
      queryStrBuilder.append("assigned_reconciler_user.given_name as assigned_reconciler_given_name, ");
      queryStrBuilder.append("assigned_reconciler_user.email as assigned_reconciler_email, ");
      queryStrBuilder.append("user9_.given_name as last_author_given_name, ");
      queryStrBuilder.append("user9_.family_name as last_author_family_name, ");
      queryStrBuilder.append("user9_.email as last_author_email, ");
      queryStrBuilder.append("user11_.given_name as last_reviewer_given_name, ");
      queryStrBuilder.append("user11_.family_name as last_reviewer_family_name, ");
      queryStrBuilder.append("user11_.email as last_reviewer_email ");
      
      // required by additional column sort
      if (pageable.getSort() != null && !pageable.getSort().isUnsorted()) {
        for (final Order s : pageable.getSort()) {
          if (s.getProperty().startsWith(ADDITIONAL_COLUMN_NAME)) {
            queryStrBuilder.append(", " + s.getProperty() + ".value ");
          }
        }
      }

      queryStrBuilder.append("FROM ");
      queryStrBuilder.append("(SELECT UUID() as 'id', map_row.id AS map_row_id, map_row.map_id, status, blind_map_flag, null as sibling_row_author_task_id ");
      queryStrBuilder.append("FROM map_row ");
      queryStrBuilder.append("WHERE map_id = :mapId ");
      queryStrBuilder.append("AND map_row.blind_map_flag = false  ");
      queryStrBuilder.append("UNION  ");
      queryStrBuilder.append("SELECT UUID() as 'id', mr1.id AS map_row_id, mr1.map_id, (CASE WHEN mr1.status != mr2.status THEN '1' ELSE mr1.status END), ");
      queryStrBuilder.append("mr1.blind_map_flag, mr2.author_task_id  ");
      queryStrBuilder.append("FROM map_row mr1, map_row mr2 ");
      queryStrBuilder.append("WHERE mr1.map_id = :mapId  ");
      queryStrBuilder.append("AND mr1.source_code_id = mr2.source_code_id  ");
      queryStrBuilder.append("AND mr1.id < mr2.id  ");
      queryStrBuilder.append("AND mr1.map_id = mr2.map_id  ");
      queryStrBuilder.append("AND mr1.blind_map_flag = true) as map_view ");
      queryStrBuilder.append("LEFT OUTER JOIN map_row_target maprowtarg1_ on (maprowtarg1_.row_id = map_view.map_row_id AND map_view.blind_map_flag = 0) ");
      queryStrBuilder.append("left outer join map_row maprow2_ on map_view.map_row_id=maprow2_.id  ");
      queryStrBuilder.append("left outer join task task3_ on maprow2_.author_task_id=task3_.id  ");
      queryStrBuilder.append("left outer join map_row maprow4_ on map_view.map_row_id=maprow4_.id ");
      queryStrBuilder.append("left outer join task task5_ on maprow4_.review_task_id=task5_.id ");
      queryStrBuilder.append("left outer join map_row maprow6_ on map_view.map_row_id=maprow6_.id ");
      queryStrBuilder.append("left outer join task task7_ on maprow6_.reconcile_task_id=task7_.id ");
      queryStrBuilder.append("left outer join map_row maprow8_ on map_view.map_row_id=maprow8_.id ");
      queryStrBuilder.append("left outer join `user` user9_ on maprow8_.`last_author_id`=user9_.id ");
      queryStrBuilder.append("left outer join map_row maprow10_ on map_view.map_row_id=maprow10_.id  ");
      queryStrBuilder.append("left outer join `user` user11_ on maprow10_.`last_reviewer_id`=user11_.id  ");
      queryStrBuilder.append("left outer join task task12_ on map_view.sibling_row_author_task_id=task12_.id  ");
      queryStrBuilder.append("left outer join map_row maprow13_ on map_view.map_row_id=maprow13_.id  ");
      queryStrBuilder.append("left outer join imported_code importedco14_ on maprow13_.source_code_id=importedco14_.id  ");
      queryStrBuilder.append("left outer join map_row maprow15_ on map_view.map_row_id=maprow15_.id  ");
      queryStrBuilder.append("left outer join `user` user16_ on maprow15_.`last_author_id`=user16_.id  ");
      queryStrBuilder.append("left outer join `user` assigned_author_user on  task3_.assignee_id=assigned_author_user.id  ");
      queryStrBuilder.append("left outer join `user` assigned_reviewer_user on task5_.assignee_id=assigned_reviewer_user.id ");
      queryStrBuilder.append("left outer join `user` assigned_reconciler_user on task7_.assignee_id=assigned_reconciler_user.id ");
      
      // required by filters and sort
      if (!CollectionUtils.isEmpty(additionalColumns)) {
        for (int i = 0; i < additionalColumns.size(); i++) { 
            queryStrBuilder.append("left outer join imported_code_additional_columns additionalColumn" + (i+1) + " on (importedco14_.id = additionalColumn" + (i+1) + ".imported_code_id AND additionalColumn" + (i+1) + ".collection_order = " + i + ") ");  
        }     
      }

      if (filter != null) {
        final String filterExpression = filter.getNativeExpression(true);
        if (filterExpression != null) {
          queryStrBuilder.append(" WHERE ").append(filterExpression);
        }
      }

      // TODO can this count query be simplified to potentially speed it up .. just the union itself will give the correct count
      Query totalRowCountQuery = entityManager.createNativeQuery("SELECT COUNT(*) FROM ( " + queryStrBuilder.toString() + " ) AS COUNT_ROWS");
      totalRowCountQuery.setParameter("mapId", map.getId());
      totalRowCountQuery.toString();
      int totalRowCount = ((Number) totalRowCountQuery.getSingleResult()).intValue();

      if (pageable.getSort() == null || pageable.getSort().isUnsorted()) {
        // equivalent to mapView.mapRow.sourceCode.index.asc()).orderBy(mapView.mapRow.lastAuthor.id.asc());
        queryStrBuilder.append(" order by importedco14_._index asc, user16_.id ");
      }
      else {
        queryStrBuilder = transformSortableForNativeQuery(queryStrBuilder, pageable.getSort(), additionalColumns, dualMapMode, task);
      }

      Query q = entityManager.createNativeQuery(queryStrBuilder.toString(), "DualMapViewResult");
      q.setParameter("mapId", map.getId());
      q.setFirstResult((int) pageable.getOffset());
      q.setMaxResults((int) pageable.getPageSize());

      List<MapView> mapViewList = new ArrayList<MapView>();
      @SuppressWarnings("unchecked")
      List<Object[]> resultsList = q.getResultList();
      resultsList.stream().forEach((record) -> {
        MapRow mapRow = (MapRow) record[0];
        MapRowTarget mapRowTarget = (MapRowTarget) record[1];
        Task siblingRowAuthorTask = (Task) record[2];
        Instant latestNote = (Instant) record[3];
        Integer mapStatusStr = (Integer) record[4];
        MapStatus mapStatus = MapStatus.values()[mapStatusStr];
        MapView mapView = new MapView(mapRow, mapRowTarget, latestNote, mapStatus, siblingRowAuthorTask);
        mapViewList.add(mapView);
      });

      final JPAQuery<MappedRowDetailsDto> mappingRowDetailsQuery = getQueryMappedRowDetailsForMap(mapId, task, filter,
          pageable);
      final List<MappedRowDetailsDto> sourceIndexResults = mappingRowDetailsQuery.fetch();

      final Page<MapView> page = new PageImpl<>(mapViewList, pageable, totalRowCount);
      final PagedModel<EntityModel<MapView>> pagedModel = assembler.toModel(page);
      final Snap2SnomedPagedModel<EntityModel<MapView>> _results = new Snap2SnomedPagedModel<>(pagedModel,
          sourceIndexResults, additionalColumns);
      return _results;

    } else {
      JPAQuery<MapView> query;
      if (dualMapMode) {
        query = getDualMapQueryForMap(mapId, task, filter, pageable.getSort());
      } else {
        query = getQueryForMap(mapId, task, filter);
      }

      query = transformSortable(query, pageable.getSort(), additionalColumns, dualMapMode, task);
      query = transformPageable(query, pageable);

      final QueryResults<MapView> results = query.fetchResults();

      final JPAQuery<MappedRowDetailsDto> mappingRowDetailsQuery = getQueryMappedRowDetailsForMap(mapId, task, filter,
          pageable);
      final List<MappedRowDetailsDto> sourceIndexResults = mappingRowDetailsQuery.fetch();

      final Page<MapView> page = new PageImpl<>(results.getResults(), pageable, results.getTotal());
      final PagedModel<EntityModel<MapView>> pagedModel = assembler.toModel(page);
      final Snap2SnomedPagedModel<EntityModel<MapView>> _results = new Snap2SnomedPagedModel<>(pagedModel,
          sourceIndexResults, additionalColumns);
      return _results;
    }
  }

  protected JPAQuery<MapView> transformPageable(JPAQuery<MapView> query, Pageable pageable) {
    if (pageable.isPaged()) {
      query = query.offset(pageable.getOffset()).limit(pageable.getPageSize());
    }
    return query;
  }

  protected StringBuilder transformSortableForNativeQuery(StringBuilder queryStringBuilder, Sort sort, List<AdditionalCodeColumn> additionalColumns, Boolean dualMapMode,
          Task task) {

    if (sort != null) {
      for (final Order s : sort) {
        List<String> field;
        switch (s.getProperty()) {
          case "rowId":
            field = Arrays.asList("maprow15_.id");
            break;
          case "sourceIndex":
            field = Arrays.asList("importedco14_._index");
            break;
          case "sourceCode":
            field = Arrays.asList("importedco14_.code");
            break;
          case "sourceDisplay":
            field = Arrays.asList("importedco14_.display");
            break;
          case "noMap":
            field = Arrays.asList("maprow15_.no_map");
            break;
          case "targetId":
            field = Arrays.asList("maprowtarg1_.id");
            break;
          case "targetCode":
            field = Arrays.asList("maprowtarg1_.target_code");
            break;
          case "targetDisplay":
            field = Arrays.asList("maprowtarg1_.target_display");
            break;
          case "relationship":
            field = Arrays.asList("maprowtarg1_.relationship");
            break;
          case "status":
            field = Arrays.asList("maprow15_.status");
            break;
          case "latestNote":
          field = null;
            field = Arrays.asList("col_2_0_");
            break;
          case "assignedAuthor":
            field = Arrays.asList("CONCAT(assigned_author_given_name, assigned_author_family_name, assigned_author_email)");
            break;
          case "assignedReconciler":
          field = null;
            field = Arrays.asList("CONCAT(assigned_reconciler_given_name, assigned_reconciler_family_name, assigned_reconciler_email)");
            break;
          case "assignedReviewer":
            field = Arrays.asList("CONCAT(assigned_reviewer_given_name, assigned_reviewer_family_name, assigned_reviewer_email)");
            break;
          // not used
          // case "lastAuthor":
          //   field = Arrays.asList("concat(concat(user9_.given_name, user9_.family_name), user9_.email)");
          //   break;
          // case "lastReviewer":
          //   field = Arrays.asList("concat(concat(user11_.given_name, user11_.family_name), user11_.email)");
          //   break;
          case "lastAuthorReviewer":
            field = Arrays.asList(
              "CONCAT(last_author_given_name, last_author_family_name, last_author_email)",
              "CONCAT(last_reviewer_given_name, last_reviewer_family_name, last_reviewer_email)"); 
            break;
          case "targetOutOfScope":
            field = null;
            // it does not make sense to sort by this flag so it is not supported
            log.warn("Unsupported MapView sort field '" + s.getProperty() + "' - ignored");
            break;
          case "flagged":
            field = Arrays.asList("maprowtarg1_.flagged");
            break;

          default:
          field = null;
            if (s.getProperty().startsWith(ADDITIONAL_COLUMN_NAME)) {
              final int index = Integer.parseInt(s.getProperty().substring(ADDITIONAL_COLUMN_NAME.length())) - 1;
              final ColumnType type = additionalColumns.get(index).getType();
              if (ColumnType.NUMBER.equals(type)) {
                field = Arrays.asList("CAST(" + s.getProperty() + ".value as double)");
              }
              else {
                field = Arrays.asList(s.getProperty() + ".value");
              }
            } else {
              field = null;
              log.warn("Unknown MapView sort field '" + s.getProperty() + "' - ignored");
            }
        }

        if (null != field) {
          boolean firstInList = true;
          for (final String f : field) {
            if (firstInList) {
              queryStringBuilder.append(" ORDER BY ").append(f);
            }
            else {
              queryStringBuilder.append(", ").append(f);
            }
            if (s.isAscending()) {
              queryStringBuilder.append(" ASC ");
            } else {
              queryStringBuilder.append(" DESC ");
            }
            firstInList = false;
          }
        }
      }
    }
    return queryStringBuilder;
  }

  protected JPAQuery<MapView> transformSortable(JPAQuery<MapView> query, Sort sort, List<AdditionalCodeColumn> additionalColumns, Boolean dualMapMode,
          Task task) {
    if (sort != null) {
      var _mapRow = dualMapMode && task == null ? mapView.mapRow : mapRow;
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
          case "assignedReconciler":
            field = Arrays.asList(getUserSortComparison(_mapRow.reconcileTask.assignee));
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
          // left outer join imported_code_additional_columns additional7_ on importedco6_.id=additional7_.imported_code_id and (additional7_.collection_order=1) 
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

  private JPAQuery<MapView> getDualMapQueryForMap(Long mapId, Task task, MapViewFilter filter, Sort sort) {

    //if (task != null) {
    
    // details / task screen .. don't display reconcile state or reconciled (mapped)
    JPAQuery<MapView> query = new JPAQuery<MapView>(entityManager)
    .select(Projections.constructor(MapView.class, mapRow, mapTarget,
        ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
            .where(note.mapRow.eq(mapRow).and(note.category.eq(NoteCategory.USER)).and(note.deleted.isFalse())), "latestNote"),
            mapRow.status))
    .from(mapRow)
    .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow))
    .leftJoin(mapRow.authorTask)
    .leftJoin(mapRow.reviewTask)
    .leftJoin(mapRow.reconcileTask)
    .leftJoin(mapRow.lastAuthor)
    .leftJoin(mapRow.lastReviewer)
    .where(getWhereClause(mapId, task, filter, false));

    if ((task != null) && (task.getType().equals(TaskType.RECONCILE) || task.getType().equals(TaskType.AUTHOR)) && sort != null && sort.isUnsorted()) {
      query = query.orderBy(mapRow.sourceCode.index.asc()).orderBy((mapRow.lastAuthor.id.asc()));
    }

    return query;

    //}
    // Could not achieve performance this way so now run a native query which is very messy / duplication of code but it is the best
    // we can do for now.
    //
    // This could be a limitation with aurora which may not be present in other dbs .. or just with the current version of aurora mysql 
    // .. it looks like it could be addressed in the future when aurora db comes into line with mysql.  Performance would be fixed by a db
    // that is capable of optimizing the "where mapid = X" clause into the view, rather than applying it to the results of the view.
    //
    // Need this supported in aurora .. "CREATE OR REPLACE ALGORITHM = MERGE VIEW myView AS"
    //
    // else {
    //   // view screen
    //   JPAQuery<MapView> query = new JPAQuery<MapView>(entityManager)
    //   .select(Projections.constructor(MapView.class, mapView.mapRow, mapTarget,
    //       ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
    //           .where(note.mapRow.eq(mapView.mapRow).and(note.category.eq(NoteCategory.USER)).and(note.deleted.isFalse())), "latestNote"),
    //           mapView.status, mapView.siblingRowAuthorTask))
    //   .from(mapView)
    //   .leftJoin(mapTarget).on(mapTarget.row.eq(mapView.mapRow).and(mapView.blindMapFlag.eq(false)))
    //   .leftJoin(mapView.mapRow.authorTask)
    //   .leftJoin(mapView.mapRow.reviewTask)
    //   .leftJoin(mapView.mapRow.reconcileTask)
    //   .leftJoin(mapView.mapRow.lastAuthor)
    //   .leftJoin(mapView.mapRow.lastReviewer)
    //   .leftJoin(mapView.siblingRowAuthorTask)
    //   .where(getMapViewWhereClause(mapId, task, filter));

    //   if (sort == null || sort.isUnsorted()) {
    //     query = query.orderBy(mapView.mapRow.sourceCode.index.asc()).orderBy(mapView.mapRow.lastAuthor.id.asc());
    //   }

    //   return query;
    // }
  }

  protected JPAQuery<MapView> getQueryForMap(Long mapId, Task task, MapViewFilter filter) {

    return new JPAQuery<MapView>(entityManager)
        .select(Projections.constructor(MapView.class, mapRow, mapTarget,
            ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
                .where(note.mapRow.eq(mapRow).and(note.category.eq(NoteCategory.USER)).and(note.deleted.isFalse())), "latestNote")))
        .from(mapRow)
        .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow))
        .leftJoin(mapRow.authorTask)
        .leftJoin(mapRow.reviewTask)
        .leftJoin(mapRow.lastAuthor)
        .leftJoin(mapRow.lastReviewer)
        .where(getWhereClause(mapId, task, filter, false))
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
    query.where(getWhereClause(mapId, task, filter, false));
    query.offset(pageable.getOffset()).limit(pageable.getPageSize());
    return query;
  }

  private BooleanExpression getMapViewWhereClause(Long mapId, Task task, MapViewFilter filter) {
    BooleanExpression whereClause = mapView.mapId.eq(mapId);//mapView.mapRow.map.id.eq(mapId);

    if (filter != null) {
      final BooleanExpression filterExpression = filter.getExpression(true);
      if (filterExpression != null) {
        whereClause = whereClause.and(filterExpression);
      }
    }

    return whereClause;
  }

  private BooleanExpression getWhereClause(Long mapId, Task task, MapViewFilter filter, boolean useDualView) {
    BooleanExpression whereClause = mapRow.map.id.eq(mapId);

    if (task != null) {
      if (task.getType().equals(TaskType.AUTHOR)) {
        whereClause = whereClause.and(mapRow.authorTask.eq(task));
        if (task.getMap().getProject().getDualMapMode()) {
          whereClause = whereClause.and(mapRow.blindMapFlag.eq(true));
        }
      } else if (task.getType().equals(TaskType.REVIEW)) {
        whereClause = whereClause.and(mapRow.reviewTask.eq(task));
        whereClause = whereClause.and(mapRow.status.ne(MapStatus.RECONCILE));
        if (task.getMap().getProject().getDualMapMode()) {
          whereClause = whereClause.and(mapRow.blindMapFlag.ne(true));
        }
      }
      else if (task.getType().equals(TaskType.RECONCILE)) {
        whereClause = whereClause.and(mapRow.blindMapFlag.eq(false));
        whereClause = whereClause.and(mapRow.reconcileTask.eq(task));
        whereClause = whereClause.and(mapRow.status.eq(MapStatus.RECONCILE));
      }
    }

    if (filter != null) {
      final BooleanExpression filterExpression = filter.getExpression(useDualView);
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

  private String collectNativeQueryOrStatement(String expression, String betweenStatement) {
    if (expression == null) {
      return betweenStatement;
    }
    if (betweenStatement == null) {
      return expression;
    }
    return expression + " OR " + betweenStatement;
  }

  private BooleanExpression collectAndStatement(BooleanExpression expression, BooleanExpression betweenStatement) {
    if (expression == null) {
      return betweenStatement;
    }
    return expression.and(betweenStatement);
  }

  private String collectNativeQueryAndStatement(String expression, String betweenStatement) {
    if (expression == null) {
      return betweenStatement;
    }
    if (betweenStatement == null) {
      return expression;
    }
    return expression + " AND " + betweenStatement;
  }

  public MapView getDualMapSiblingRow(Long mapId, Long sourceCodeId, Long mapRowId) {

    if (!mapRepository.existsById(mapId)) {
      throw Problem.valueOf(Status.NOT_FOUND, "No Map found with id " + mapId);
    }

    JPAQuery<MapView> query = new JPAQuery<MapView>(entityManager)
        .select(Projections.constructor(MapView.class, mapRow, mapTarget,
            ExpressionUtils.as(JPAExpressions.select(note.modified.max()).from(note)
                .where(note.mapRow.eq(mapRow).and(note.category.eq(NoteCategory.USER)).and(note.deleted.isFalse())), "latestNote")))
        .from(mapRow)
        .leftJoin(mapTarget).on(mapTarget.row.eq(mapRow))
        .where(mapRow.map.id.eq(mapId))
        .where(mapRow.id.ne(mapRowId))
        .where(mapRow.sourceCode.id.eq(sourceCodeId));

    QueryResults<MapView> queryResults = query.fetchResults();
    if (queryResults.getResults().size() > 0) {
      return queryResults.getResults().get(0);
    }
    return null;

  }

}
