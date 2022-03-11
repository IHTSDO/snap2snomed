package org.snomed.snap2snomed.controller;

import org.snomed.snap2snomed.controller.dto.ImportMappingFileDetails;
import org.snomed.snap2snomed.controller.dto.MappingImportResponse;
import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.security.WebSecurity;
import org.snomed.snap2snomed.service.CodeSetImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;

@Validated
@RestController
public class ImportedMappingRestController {

  @Autowired
  private CodeSetImportService importService;


  @Operation
  @PostMapping(value = "/importedMappings/import", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE},
      produces = {MediaType.APPLICATION_JSON_VALUE})
  MappingImportResponse importMappingFile(
      @Parameter(description = "Details of the file being imported", content = @Content(mediaType = "application/json"))
          @RequestPart(name = "importDetails",
          required = true) @Validated ImportMappingFileDetails importDetails,
      @Parameter(description = "The file to be imported",content = {@Content(mediaType = "text/tsv"), @Content(mediaType = "text/csv")})
          @RequestPart(name = "file",
          required = true) MultipartFile file) throws HttpMediaTypeNotAcceptableException {

    return importService.importMappings(importDetails, file);
  }

}
