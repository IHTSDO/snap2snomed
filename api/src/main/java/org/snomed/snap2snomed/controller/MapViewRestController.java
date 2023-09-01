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

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.xssf.streaming.SXSSFCell;
import org.apache.poi.xssf.streaming.SXSSFRow;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.hl7.fhir.r4.model.ConceptMap;
import org.hl7.fhir.r4.model.ConceptMap.ConceptMapGroupComponent;
import org.hl7.fhir.r4.model.ConceptMap.SourceElementComponent;
import org.hl7.fhir.r4.model.ConceptMap.TargetElementComponent;
import org.hl7.fhir.r4.model.Enumerations.ConceptMapEquivalence;
import org.hl7.fhir.r4.model.Enumerations.PublicationStatus;
import org.hl7.fhir.r4.model.UriType;
import org.snomed.snap2snomed.controller.dto.Snap2SnomedPagedModel;
import org.snomed.snap2snomed.model.ImportedCodeSet;
import org.snomed.snap2snomed.model.AdditionalCodeValue;
import org.snomed.snap2snomed.model.MapView;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;
import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.repository.MapRepository;
import org.snomed.snap2snomed.security.WebSecurity;
import org.snomed.snap2snomed.service.FhirService;
import org.snomed.snap2snomed.service.MapViewService;
import org.snomed.snap2snomed.service.MapViewService.MapViewFilter;
import org.snomed.snap2snomed.service.TerminologyProvider;
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

import ca.uhn.fhir.parser.IParser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/mapView")
// Removed @RepositoryRestController annotation as per
// https://stackoverflow.com/questions/43092913/can-i-offer-an-endpoint-in-parallel-to-a-spring-data-rest-get
public class MapViewRestController {

  public static final String APPLICATION_XSLX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  public static final String TEXT_TSV = "text/tab-separated-values";

  public static final String TEXT_CSV = "text/csv";

  public static final String FHIR_JSON = "application/fhir+json";

  @Autowired
  MapViewService mapViewService;

  @Autowired
  WebSecurity webSecurity;

  @Autowired
  TerminologyProvider terminology;

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
  @Parameter(name = "targetOutOfScope", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that have a target out of scope or not.")
  @Parameter(name = "flagged", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that are flagged or not flagged.")
  @Parameter(name = "additionalColumns", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those with an additional column matching one of the specified values.")
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
      @RequestParam(required = false) Boolean targetOutOfScope,
      @RequestParam(required = false) Boolean flagged,
      @RequestParam(required = false) List<String> additionalColumns,
      @Parameter(hidden = true) Pageable pageable,
      @Parameter(hidden = true) PagedResourcesAssembler<MapView> assembler) {

    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForMapId(mapId)) {
      throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project!");
    }

    final MapViewFilter filter = mapViewService.new MapViewFilter(sourceCode, sourceDisplay, noMap, targetCode, targetDisplay, relationship,
        status, lastAuthor, lastReviewer, lastAuthorReviewer, assignedAuthor, assignedReviewer, targetOutOfScope, flagged, additionalColumns);

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
  @Parameter(name = "targetOutOfScope", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that have a target out of scope or not.")
  @Parameter(name = "flagged", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those that are flagged or not flagged.")
  @Parameter(name = "additionalColumns", in = ParameterIn.QUERY, required = false, allowEmptyValue = true,
      description = "Filters the results to those with an additional column matching one of the specified values.")
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
      @RequestParam(required = false) Boolean targetOutOfScope,
      @RequestParam(required = false) Boolean flagged,
      @RequestParam(required = false) List<String> additionalColumns,
      @Parameter(hidden = true) Pageable pageable,
      @Parameter(hidden = true) PagedResourcesAssembler<MapView> assembler) {

    final MapViewFilter filter = mapViewService.new MapViewFilter(sourceCode, sourceDisplay, noMap, targetCode, targetDisplay, relationship,
        status, lastAuthor, lastReviewer, lastAuthorReviewer, assignedAuthor, assignedReviewer, targetOutOfScope, flagged, additionalColumns);

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
  @Parameter(name="extraColumns", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Additional columns to include. Options are ( notes | lastAuthor | lastReviewer | assignedAuthor | assignedReviewer ).")
  @GetMapping(path = "/{mapId}", produces = {TEXT_CSV, TEXT_TSV})
  public void getMapViewCsv(HttpServletResponse response, @RequestHeader(name = "Accept", required = false) String contentType,
      @PathVariable("mapId") Long mapId,
      @RequestParam(required = false) List<String> extraColumns) {

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
            format.builder().setHeader(mapViewService.getExportHeader(mapId, extraColumns)).build());) {
      
      for (final MapView mapView : mapViewService.getAllMapViewForMap(mapId)) {

        ArrayList<Object> printRow = new ArrayList<Object>(Arrays.asList(mapView.getSourceCode(), mapView.getSourceDisplay()));

        // additional source columns
        if (mapView.getAdditionalColumns() != null) {
            if (mapView.getAdditionalColumns().size() > 0) {
                for (int i = 0; i < mapView.getAdditionalColumns().size(); i++) {
                    final AdditionalCodeValue additionalColumn = mapView.getAdditionalColumns().get(i);
                    printRow.add(additionalColumn.getValue());
                }
            }
        }

        printRow.addAll(Arrays.asList(mapView.getTargetCode(), mapView.getTargetDisplay(),
            mapView.getRelationship(), mapView.getRelationship() == null ? "" : mapView.getRelationship().getLabel(),
            mapView.getNoMap() == null ? "" : mapView.getNoMap(),
            mapView.getStatus()));

        if (extraColumns != null && extraColumns.size() > 0) {
            for (String extraColumn : extraColumns) {
                switch (extraColumn.toUpperCase()) {
                    case "NOTES":
                        printRow.add(mapView.getAppendedNotes());
                        break;
                    case "ASSIGNEDAUTHOR":
                        printRow.add(mapView.getAssignedAuthor() == null ? "" : mapView.getAssignedAuthor().getFullName());
                        break;
                    case "ASSIGNEDREVIEWER":
                        printRow.add(mapView.getAssignedReviewer() == null ? "" : mapView.getAssignedReviewer().getFullName());
                        break;
                    case "LASTAUTHOR":
                        printRow.add(mapView.getLastAuthor() == null ? "" : mapView.getLastAuthor().getFullName());
                        break;
                    case "LASTREVIEWER":
                        printRow.add(mapView.getLastReviewer() == null ? "" : mapView.getLastReviewer().getFullName());
                        break;
                }
            }
        }
        csvPrinter.printRecord(printRow);
      }
      csvPrinter.flush();
      writer.flush();
    } catch (final IOException e) {
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
  @Parameter(name="extraColumns", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Additional columns to include. Options are ( notes | lastAuthor | lastReviewer | assignedAuthor | assignedReviewer ).")
  @GetMapping(path = "/{mapId}", produces = APPLICATION_XSLX)
  public void getMapViewExcel(HttpServletResponse response, 
        @PathVariable("mapId") Long mapId,
        @RequestParam(required = false) List<String> extraColumns) throws IOException {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }
    if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForMapId(mapId)) {
      throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project!");
    }

    response.setContentType(APPLICATION_XSLX);
    response.setHeader("Content-Disposition",
        "attachment; filename=\"" + mapViewService.getFileNameForMapExport(mapId, APPLICATION_XSLX) + "\"");

    final List<MapView> mapViewResult = mapViewService.getAllMapViewForMap(mapId);

    try (SXSSFWorkbook wb = new SXSSFWorkbook(10000)) {

      final SXSSFSheet sh = wb.createSheet();
      final SXSSFRow header = sh.createRow(0);

      final String[] exportHeader = mapViewService.getExportHeader(mapId, extraColumns);

      for (int cellNum = 0; cellNum < exportHeader.length; cellNum++) {
        final SXSSFCell cell = header.createCell(cellNum);
        cell.setCellValue(exportHeader[cellNum]);
      }

      for (int rownum = 1; rownum <= mapViewResult.size(); rownum++) {
        final MapView mapView = mapViewResult.get(rownum - 1);

        final SXSSFRow row = sh.createRow(rownum);

        SXSSFCell cell = row.createCell(0);
        cell.setCellValue(mapView.getSourceCode());

        cell = row.createCell(1);
        cell.setCellValue(mapView.getSourceDisplay());

        int cellCount = 2;
        // additional source columns
        if (mapView.getAdditionalColumns() != null) {
            for (int i = 0; i < mapView.getAdditionalColumns().size(); i++) {
                cell = row.createCell(cellCount);
                final AdditionalCodeValue additionalColumn = mapView.getAdditionalColumns().get(i);
                cell.setCellValue(additionalColumn.getValue());
                cellCount++;
            }
        }

        cell = row.createCell(cellCount);
        cell.setCellValue(mapView.getTargetCode());
        cellCount++;

        cell = row.createCell(cellCount);
        cell.setCellValue(mapView.getTargetDisplay());
        cellCount++;

        cell = row.createCell(cellCount);
        cell.setCellValue(mapView.getRelationship() == null ? "" : mapView.getRelationship().toString());
        cellCount++;

        cell = row.createCell(cellCount);
        cell.setCellValue(mapView.getRelationship() == null ? "" : mapView.getRelationship().getLabel());
        cellCount++;

        cell = row.createCell(cellCount);
        if (mapView.getNoMap() != null) {
          cell.setCellValue(mapView.getNoMap());
        }
        cellCount++;

        cell = row.createCell(cellCount);
        cell.setCellValue(mapView.getStatus() == null ? "" : mapView.getStatus().toString());
        cellCount++;

        if (extraColumns != null && extraColumns.size() > 0) {
            for (String extraColumn : extraColumns) {
                cell = row.createCell(cellCount);
                switch (extraColumn.toUpperCase()) {
                    case "NOTES":
                        cell.setCellValue(mapView.getAppendedNotes());
                        break;
                    case "ASSIGNEDAUTHOR":
                        cell.setCellValue(mapView.getAssignedAuthor() == null ? "" : mapView.getAssignedAuthor().getFullName());
                        break;
                    case "ASSIGNEDREVIEWER":
                        cell.setCellValue(mapView.getAssignedReviewer() == null ? "" : mapView.getAssignedReviewer().getFullName());
                        break;
                    case "LASTAUTHOR":
                        cell.setCellValue(mapView.getLastAuthor() == null ? "" : mapView.getLastAuthor().getFullName());
                        break;
                    case "LASTREVIEWER":
                        cell.setCellValue(mapView.getLastReviewer() == null ? "" : mapView.getLastReviewer().getFullName());
                        break;
                }
                cellCount++;
            }
        }

      }
      wb.write(response.getOutputStream());

      wb.dispose();
    }
  }

  @Operation(description = "Returns a flattened view of the MapRows and MapRowTargets for the specified mapId.")
  @Parameter(name = "page", in = ParameterIn.QUERY, required = false, allowEmptyValue = false, description = "Zero-based page index (0..N)")
  @Parameter(name = "size", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "The size of the page to be returned")
  @Parameter(name = "sort", in = ParameterIn.QUERY, required = false, allowEmptyValue = false,
      description = "Sorting criteria in the format: property(,asc|desc). Default sort order is ascending. Multiple sort criteria are supported.",
      array = @ArraySchema(schema = @Schema(type = "string")))
  @GetMapping(path = "/{mapId}", produces = {FHIR_JSON})
  public void getMapViewConceptMapJson(HttpServletResponse response, @RequestHeader(name = "Accept", required = false) String contentType,
          @PathVariable("mapId") Long mapId) {

      if (!webSecurity.isValidUser()) {
          throw new NoSuchUserProblem();
      }
      if (!webSecurity.isAdminUser() && !webSecurity.hasAnyProjectRoleForMapId(mapId)) {
          throw new NotAuthorisedProblem("Not authorised to view map if the user is not admin or member of an associated project!");
      }

      response.setContentType(FHIR_JSON);
      response.setHeader("Content-Disposition",
              "attachment; filename=\"" + mapViewService.getFileNameForMapExport(mapId, FHIR_JSON)
              + "\"");


      final ConceptMap cm = convertToConceptMap(mapId);

      try (final BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(response.getOutputStream()))) {
          final IParser parser = terminology.getFhirContext().newJsonParser();
          parser.encodeResourceToWriter(cm, writer);
          writer.flush();
      } catch (final IOException e) {
          throw Problem.builder().withDetail("IO error exporting").build();
      }
  }

  @Autowired
  private MapRepository mapRepo;

  private ConceptMap convertToConceptMap(Long mapId) {
      final Map<Long, SourceElementComponent> mapEntry = new HashMap<>();
      final ConceptMap cm = new ConceptMap();
      final ConceptMapGroupComponent group = cm.addGroup();

      mapRepo.findById(mapId).ifPresent(map -> {
          final Project project = map.getProject();
          final String title = project.getTitle();
          cm.setStatus(PublicationStatus.UNKNOWN);
          cm.setDate(Date.from(map.getModified()));
          cm.setTitle(title);
          cm.setName(title.replaceAll("[^\\w\\d]", "_"));
          cm.setDescription(project.getDescription());
          cm.setVersion(map.getMapVersion());

          final ImportedCodeSet source = map.getSource();
          String valuesetUri = source.getValuesetUri();
          if (null != valuesetUri) {
              cm.setSource(new UriType(valuesetUri));
          }

          final String ecl = map.getToScope();
          cm.setTarget(new UriType(FhirService.DEFAULT_CODE_SYSTEM + "?fhir_vs=ecl/" + ecl));

          String systemUri = source.getSystemUri();
          if (null != systemUri) {
              group.setSource(systemUri);
          }
          group.setSourceVersion(source.getVersion());
          group.setTarget(FhirService.DEFAULT_CODE_SYSTEM);
          group.setTargetVersion(map.getToVersion());
      });


      for (final MapView mapView : mapViewService.getAllMapViewForMap(mapId)) {
          final Long key = mapView.getSourceIndex();
          final SourceElementComponent src;
          if (!mapEntry.containsKey(key)) {
              src = group.addElement();
              src.setCode(mapView.getSourceCode());
              src.setDisplay(mapView.getSourceDisplay());

              mapEntry.put(key, src);
          } else {
              src = mapEntry.get(key);
          }

          final TargetElementComponent tgt = src.addTarget();
          if (null != mapView.getNoMap() && mapView.getNoMap()) {
              tgt.setEquivalence(ConceptMapEquivalence.UNMATCHED);
          } else {
              tgt.setCode(mapView.getTargetCode());
              tgt.setDisplay(mapView.getTargetDisplay());
              if (null != mapView.getRelationship()) {
                  switch (mapView.getRelationship()) {
                  case TARGET_EQUIVALENT:
                      tgt.setEquivalence(ConceptMapEquivalence.EQUIVALENT);
                      break;
                  case TARGET_BROADER:
                      tgt.setEquivalence(ConceptMapEquivalence.WIDER);
                      break;
                  case TARGET_NARROWER:
                      tgt.setEquivalence(ConceptMapEquivalence.NARROWER);
                      break;
                  case TARGET_INEXACT:
                      tgt.setEquivalence(ConceptMapEquivalence.RELATEDTO);
                      break;
                  }
              }

              if (mapView.getNoMap()) {
                  tgt.setEquivalence(ConceptMapEquivalence.UNMATCHED);
              }

          }
      }
      return cm;
  }


}
