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

import static java.lang.String.format;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.history.Revision;
import org.springframework.data.history.RevisionMetadata;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.repository.support.Repositories;
import org.springframework.data.rest.webmvc.BasePathAwareController;
import org.springframework.data.rest.webmvc.PersistentEntityResourceAssembler;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.data.rest.webmvc.RootResourceInformation;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.Assert;
import org.springframework.util.ReflectionUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

// https://github.com/spring-projects/spring-data-envers/issues/35

// @ PreAuthorize("isValidUser()")
@RepositoryRestController
public class GenericRevisionsController implements InitializingBean {

  private static Method REVISIONS_METHOD = null;
  private static Method FIND_REVISION_METHOD = null;
  private static Method FIND_LAST_CHANGE_REVISION_METHOD = null;

  static {
    REVISIONS_METHOD = ReflectionUtils.findMethod(RevisionRepository.class, "findRevisions", Object.class, Pageable.class);
    Assert.notNull(REVISIONS_METHOD, "findRevisions method cannot be null");
    FIND_REVISION_METHOD = ReflectionUtils.findMethod(RevisionRepository.class, "findRevision", Object.class, Number.class);
    Assert.notNull(FIND_REVISION_METHOD, "findRevision method cannot be null");
    FIND_LAST_CHANGE_REVISION_METHOD = ReflectionUtils.findMethod(RevisionRepository.class, "findLastChangeRevision", Object.class);
    Assert.notNull(FIND_LAST_CHANGE_REVISION_METHOD, "findLastChangeRevision method cannot be null");
  }

  private final Repositories repositories;
  private final PagedResourcesAssembler<Object> pagedResourcesAssembler;
  private final ObjectMapper objectMapper;

  @Autowired
  GenericRevisionsController(Repositories repositories, PagedResourcesAssembler<Object> assembler, ObjectMapper objectMapper) {
    this.repositories = repositories;
    this.pagedResourcesAssembler = assembler;
    this.objectMapper = objectMapper;
  }

  @Operation(description = "Gets all the revisions of the specified resource - because this can be large it is pageable")
  @SuppressWarnings("unchecked")
  @RequestMapping(value = "/{repository}/{id}/revisions", method = RequestMethod.GET, produces = {"application/hal+json",
      "application/json"})
  public ResponseEntity<CollectionModel<?>> getRevisions(
      RootResourceInformation rootResourceInformation,
      @Parameter(description = "Repository the resource belongs to, e.g. maps, projects or tasks", required = true) @PathVariable String repository,
      @Parameter(description = "ID of the resource to get revision history for", required = true) @PathVariable String id,
      Pageable pageable,
      PersistentEntityResourceAssembler assembler) {

    Optional<Object> repo = repositories.getRepositoryFor(rootResourceInformation.getDomainType());
    repo.orElseThrow(() -> new IllegalStateException(format("Unable to find repository '%s'", repository)));

    Page<Object> page = (Page<Object>) ReflectionUtils.invokeMethod(REVISIONS_METHOD, repo.get(), getLongOrString(id), pageable);

    if (page.getContent().isEmpty()) {

      return new ResponseEntity<CollectionModel<?>>(pagedResourcesAssembler.toEmptyModel(page, Revision.class), HttpStatus.OK);
    } else {

      List<Object> entities = new ArrayList<>();
      for (Object revision : page) {
        entities.add(((Revision) revision).getEntity());
      }

      return new ResponseEntity<CollectionModel<?>>(pagedResourcesAssembler.toModel(page), HttpStatus.OK);
    }
  }

  private Object getLongOrString(String id) {
    try {
      return Long.parseLong(id);
    } catch (NumberFormatException nfe) {
      return id;
    }
  }

  @Operation(description = "Gets a specific revision by id of a specified resource")
  @SuppressWarnings("unchecked")
  @RequestMapping(value = "/{repository}/{id}/revisions/{revisionId}", method = RequestMethod.GET, produces = {"application/hal+json",
      "application/json"})
  public ResponseEntity<EntityModel<?>> getRevision(
      RootResourceInformation rootResourceInformation,
      @Parameter(description = "Repository the resource belongs to, e.g. maps, projects or tasks", required = true) @PathVariable String repository,
      @Parameter(description = "ID of the resource to get revision history for", required = true) @PathVariable String id,
      @Parameter(description = "ID of the specific revision of the resource to get", required = true) @PathVariable Integer revisionId) {

    Optional<Object> repo = repositories.getRepositoryFor(rootResourceInformation.getDomainType());
    repo.orElseThrow(() -> new IllegalStateException(format("Unable to find repository '%s'", repository)));

    Optional<Revision<?, ?>> revision = (Optional<Revision<?, ?>>) ReflectionUtils.invokeMethod(FIND_REVISION_METHOD, repo.get(),
        getLongOrString(id),
        revisionId);

    if (revision.isPresent()) {
      return new ResponseEntity<EntityModel<?>>(EntityModel.of(revision.get()), HttpStatus.OK);
    }

    return ResponseEntity.notFound().build();
  }

  @Operation(description = "Gets the most recent revision of a specified resource")
  @SuppressWarnings("unchecked")
  @RequestMapping(value = "/{repository}/{id}/latestRevision", method = RequestMethod.GET, produces = {"application/hal+json",
      "application/json"})
  public ResponseEntity<EntityModel<?>> getLastChangeRevision(
      RootResourceInformation rootResourceInformation,
      @Parameter(description = "Repository the resource belongs to, e.g. maps, projects or tasks", required = true) @PathVariable String repository,
      @Parameter(description = "ID of the resource to get revision history for", required = true) @PathVariable String id) {

    Optional<Object> repo = repositories.getRepositoryFor(rootResourceInformation.getDomainType());
    repo.orElseThrow(() -> new IllegalStateException(format("Unable to find repository '%s'", repository)));

    Optional<Revision<?, ?>> revision = (Optional<Revision<?, ?>>) ReflectionUtils.invokeMethod(FIND_LAST_CHANGE_REVISION_METHOD,
        repo.get(), getLongOrString(id));

    if (revision.isPresent()) {
      return new ResponseEntity<EntityModel<?>>(EntityModel.of(revision.get()), HttpStatus.OK);
    }

    return ResponseEntity.notFound().build();
  }

  public class RevisionOverride {

    @JsonIgnore
    RevisionMetadata metadata;
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    objectMapper.addMixIn(Revision.class, GenericRevisionsController.RevisionOverride.class);
  }
}
