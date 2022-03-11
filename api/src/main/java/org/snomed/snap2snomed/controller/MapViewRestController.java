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

package org.snomed.snap2snomed.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.xssf.streaming.SXSSFCell;
import org.apache.poi.xssf.streaming.SXSSFRow;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.snomed.snap2snomed.controller.dto.Snap2SnomedPagedModel;
import org.snomed.snap2snomed.model.MapView;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.security.WebSecurity;
import org.snomed.snap2snomed.service.MapViewService;
import org.snomed.snap2snomed.service.MapViewService.MapViewFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

@RestController
@RequestMapping("/mapView")
// Removed @RepositoryRestController annotation as per 
// https://stackoverflow.com/questions/43092913/can-i-offer-an-endpoint-in-parallel-to-a-spring-data-rest-get
public class MapViewRestController {

  public static final String APPLICATION_XSLX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  public static final String TEXT_TSV = "text/tab-separated-values";

  public static final String TEXT_CSV = "text/csv";

  public static final String[] EXPORT_HEADER = {"\ufeff" + "Source code", "Source display", "Target code", "Target display", "Relationship type code",
      "Relationship type display", "No map flag", "Status"};

  @Autowired
  MapViewService mapViewService;

  @Autowired
  WebSecurity webSecurity;

  @Operation(description = "Returns a flattened view of the MapRows and MapRowTargets for the specified mapId.")
  @Parameter(name = "mapId", in = ParameterIn.PATH, required = true, allowEmptyValue = false,
      description = "Id of the map the view is to be generated for")
  @Parameter(name = "sourceCode", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results by ensuring source codes start with the specified text. "
          + "Multiple values will be treated as 'or' conditions - matching codes must start with one of the specified values.")
  @Parameter(name = "sourceDisplay", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results by ensuring source displays contain the specified text. "
          + "Multiple values will be treated as 'and' conditions - matching display text must contain all of the specified values.")
  @Parameter(name = "targetCode", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results by ensuring target codes start with the specified text. "
          + "Multiple values will be treated as 'or' conditions - matching codes must start with one of the specified values.")
  @Parameter(name = "targetDisplay", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results by ensuring target displays contain the specified text. "
          + "Multiple values will be treated as 'and' conditions - matching display text must contain all of the specified values.")
  @Parameter(name = "relationships", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that have target relationships matching one of the specified values.")
  @Parameter(name = "status", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that have statuses matching one of the specified values.")
  @Parameter(name = "lastAuthor", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that were last authored by one of the specified user ids.")
  @Parameter(name = "lastReviewer", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that were last reviewed by one of the specified user ids.")
  @Parameter(name = "lastAuthorReviewer", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that were last authored OR reviewed by one of the specified user ids.")
  @Parameter(name = "assignedAuthor", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that are assigned to an author task assigned to one of the specified user ids.")
  @Parameter(name = "assignedReviewer", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that are assigned to an review task assigned to one of the specified user ids.")
  @Parameter(name = "flagged", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that are flagged or not flagged.")
  @Parameter(name = "page", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Zero-based page index (0..N)")
  @Parameter(name = "size", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "The size of the page to be returned")
  @Parameter(name = "sort", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Sorting criteria in the format: property(,asc|desc). Default sort order is ascending. Multiple sort criteria are supported.",
      array = @ArraySchema(schema = @Schema(type = "string")))
  @GetMapping(path = "/{mapId}", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Snap2SnomedPagedModel<EntityModel<MapView>>> getMapView(
      @PathVariable("mapId") Long mapId,
      @RequestParam(required = false) List<String> sourceCode,
      @RequestParam(required = false) List<String> sourceDisplay,
      @RequestParam(required = false) Boolean noMap,
      @RequestParam(required = false) List<String> targetCode,
      @RequestParam(required = false) List<String> targetDisplay,
      @RequestParam(required = false) List<MappingRelationship> relationship,
      @RequestParam(required = false) List<MapStatus> status,
      @RequestParam(required = false) List<String> lastAuthor,
      @RequestParam(required = false) List<String> lastReviewer,
      @RequestParam(required = false) List<String> lastAuthorReviewer,
      @RequestParam(required = false) List<String> assignedAuthor,
      @RequestParam(required = false) List<String> assignedReviewer,
      @RequestParam(required = false) Boolean flagged,
      @Parameter(hidden = true) Pageable pageable,
      @Parameter(hidden = true) PagedResourcesAssembler<MapView> assembler) {

    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForMapId(mapId)) {
      throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project!");
    }
        
    MapViewFilter filter = mapViewService.new MapViewFilter(sourceCode, sourceDisplay, noMap, targetCode, targetDisplay, relationship,
        status, lastAuthor, lastReviewer, lastAuthorReviewer, assignedAuthor, assignedReviewer, flagged);

    return ResponseEntity.ok(mapViewService.getMapResults(mapId, pageable, assembler, filter));
  }

  @Operation(description = "Returns a flattened view of the MapRows and MapRowTargets for the specified taskId.")
  @Parameter(name = "taskId", in = ParameterIn.PATH, required = true, allowEmptyValue = false,
      description = "Id of the task the view is to be generated for, tasks are related to a map so the map id is implicitly specified.")
  @Parameter(name = "sourceCode", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results by ensuring source codes start with the specified text. "
          + "Multiple values will be treated as 'or' conditions - matching codes must start with one of the specified values.")
  @Parameter(name = "sourceDisplay", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results by ensuring source displays contain the specified text. "
          + "Multiple values will be treated as 'and' conditions - matching display text must contain all of the specified values.")
  @Parameter(name = "targetCode", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results by ensuring target codes start with the specified text. "
          + "Multiple values will be treated as 'or' conditions - matching codes must start with one of the specified values.")
  @Parameter(name = "targetDisplay", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results by ensuring target displays contain the specified text. "
          + "Multiple values will be treated as 'and' conditions - matching display text must contain all of the specified values.")
  @Parameter(name = "relationships", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that have target relationships matching one of the specified values.")
  @Parameter(name = "status", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that have statuses matching one of the specified values.")
  @Parameter(name = "lastAuthor", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that were last authored by one of the specified user ids.")
  @Parameter(name = "lastReviewer", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that were last reviewed by one of the specified user ids.")
  @Parameter(name = "lastAuthorReviewer", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that were last authored OR reviewed by one of the specified user ids.")
  @Parameter(name = "assignedAuthor", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that are assigned to an author task assigned to one of the specified user ids.")
  @Parameter(name = "assignedReviewer", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that are assigned to an review task assigned to one of the specified user ids.")
  @Parameter(name = "flagged", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that are flagged or not flagged.")
  @Parameter(name = "page", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Zero-based page index (0..N)")
  @Parameter(name = "size", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "The size of the page to be returned")
  @Parameter(name = "sort", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Sorting criteria in the format: property(,asc|desc). Default sort order is ascending. Multiple sort criteria are supported.",
      array = @ArraySchema(schema = @Schema(type = "string")))
  @GetMapping(path = "/task/{taskId}", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Snap2SnomedPagedModel<EntityModel<MapView>>> getTaskView(
      @PathVariable("taskId") Long taskId,
      @RequestParam(required = false) List<String> sourceCode,
      @RequestParam(required = false) List<String> sourceDisplay,
      @RequestParam(required = false) Boolean noMap,
      @RequestParam(required = false) List<String> targetCode,
      @RequestParam(required = false) List<String> targetDisplay,
      @RequestParam(required = false) List<MappingRelationship> relationship,
      @RequestParam(required = false) List<MapStatus> status,
      @RequestParam(required = false) List<String> lastAuthor,
      @RequestParam(required = false) List<String> lastReviewer,
      @RequestParam(required = false) List<String> lastAuthorReviewer,
      @RequestParam(required = false) List<String> assignedAuthor,
      @RequestParam(required = false) List<String> assignedReviewer,
      @RequestParam(required = false) Boolean flagged,
      @Parameter(hidden = true) Pageable pageable,
      @Parameter(hidden = true) PagedResourcesAssembler<MapView> assembler) {

    MapViewFilter filter = mapViewService.new MapViewFilter(sourceCode, sourceDisplay, noMap, targetCode, targetDisplay, relationship,
        status, lastAuthor, lastReviewer, lastAuthorReviewer, assignedAuthor, assignedReviewer, flagged);

    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    // Associated Project role checking happens in the service
    return ResponseEntity.ok(mapViewService.getMapResultsByTask(taskId, pageable, assembler, filter));
  }

  @Operation(description = "Returns a flattened view of the MapRows and MapRowTargets for the specified mapId.")
  @Parameter(name = "page", in = ParameterIn.QUERY, required = false, allowEmptyValue = false, description = "Zero-based page index (0..N)")
  @Parameter(name = "size", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "The size of the page to be returned")
  @Parameter(name = "sort", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Sorting criteria in the format: property(,asc|desc). Default sort order is ascending. Multiple sort criteria are supported.",
      array = @ArraySchema(schema = @Schema(type = "string")))
  @GetMapping(path = "/{mapId}", produces = {TEXT_CSV, TEXT_TSV})
  public void getMapViewCsv(HttpServletResponse response, @RequestHeader(name = "Accept", required = false) String contentType,
      @PathVariable("mapId") Long mapId) {

    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForMapId(mapId)) {
      throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project!");
    }        

    CSVFormat format;
    switch (contentType) {
      case TEXT_CSV:
        format = CSVFormat.DEFAULT;
        response.setContentType(TEXT_CSV);
        break;

      case TEXT_TSV:
        format = CSVFormat.TDF;
        response.setContentType(TEXT_TSV);
        break;

      default:
        throw Problem.valueOf(Status.UNSUPPORTED_MEDIA_TYPE,
            "Content type '" + contentType + "' requested in the Accept header is not supported");

    }

    response.setHeader("Content-Disposition",
        "attachment; filename=\"" + mapViewService.getFileNameForMapExport(mapId, contentType)
            + "\"");

    try (BufferedWriter writer = new BufferedWriter(
        new OutputStreamWriter(response.getOutputStream()));

        CSVPrinter csvPrinter = new CSVPrinter(writer,
            format.builder().setHeader(EXPORT_HEADER).build());) {
      for (MapView mapView : mapViewService.getAllMapViewForMap(mapId)) {
        csvPrinter.printRecord(
            mapView.getSourceCode(), mapView.getSourceDisplay(),
            mapView.getTargetCode(), mapView.getTargetDisplay(),
            mapView.getRelationship(), mapView.getRelationship() == null ? "" : mapView.getRelationship().getLabel(),
            mapView.getNoMap() == null ? "" : mapView.getNoMap(),
            mapView.getStatus());
      }
      csvPrinter.flush();
      writer.flush();
    } catch (IOException e) {
      throw Problem.builder().withDetail("IO error exporting").build();
    }
  }

  @Operation(description = "Returns a flattened view of the MapRows and MapRowTargets for the specified mapId.")
  @Parameter(name = "page", in = ParameterIn.QUERY, required = false, allowEmptyValue = false, description = "Zero-based page index (0..N)")
  @Parameter(name = "size", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "The size of the page to be returned")
  @Parameter(name = "sort", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Sorting criteria in the format: property(,asc|desc). Default sort order is ascending. Multiple sort criteria are supported.",
      array = @ArraySchema(schema = @Schema(type = "string")))
  @GetMapping(path = "/{mapId}", produces = APPLICATION_XSLX)
  public void getMapViewExcel(HttpServletResponse response, @PathVariable("mapId") Long mapId) throws IOException {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForMapId(mapId)) {
      throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project!");
    }

    response.setContentType(APPLICATION_XSLX);
    response.setHeader("Content-Disposition",
        "attachment; filename=\"" + mapViewService.getFileNameForMapExport(mapId, APPLICATION_XSLX) + "\"");

    List<MapView> mapViewResult = mapViewService.getAllMapViewForMap(mapId);

    try (SXSSFWorkbook wb = new SXSSFWorkbook(10000)) {

      SXSSFSheet sh = wb.createSheet();
      SXSSFRow header = sh.createRow(0);

      for (int cellNum = 0; cellNum < EXPORT_HEADER.length; cellNum++) {
        SXSSFCell cell = header.createCell(cellNum);
        cell.setCellValue(EXPORT_HEADER[cellNum]);
      }

      for (int rownum = 1; rownum <= mapViewResult.size(); rownum++) {
        MapView mapView = mapViewResult.get(rownum - 1);

        SXSSFRow row = sh.createRow(rownum);

        SXSSFCell cell = row.createCell(0);
        cell.setCellValue(mapView.getSourceCode());

        cell = row.createCell(1);
        cell.setCellValue(mapView.getSourceDisplay());

        cell = row.createCell(2);
        cell.setCellValue(mapView.getTargetCode());

        cell = row.createCell(3);
        cell.setCellValue(mapView.getTargetDisplay());

        cell = row.createCell(4);
        cell.setCellValue(mapView.getRelationship() == null ? "" : mapView.getRelationship().toString());

        cell = row.createCell(5);
        cell.setCellValue(mapView.getRelationship() == null ? "" : mapView.getRelationship().getLabel());

        cell = row.createCell(6);
        if (mapView.getNoMap() != null) {
          cell.setCellValue(mapView.getNoMap());
        }

        cell = row.createCell(7);
        cell.setCellValue(mapView.getStatus() == null ? "" : mapView.getStatus().toString());

      }
      wb.write(response.getOutputStream());

      wb.dispose();
    }
  }


}
