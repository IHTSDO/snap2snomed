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

import org.snomed.snap2snomed.model.ImportedCode;
import org.snomed.snap2snomed.model.ImportedCodeSet;
import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.MapRow;
import org.snomed.snap2snomed.model.MapRowTarget;
import org.snomed.snap2snomed.model.Note;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.repository.handler.*;
import org.snomed.snap2snomed.security.Snap2SnomedAuditorAwareImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.projection.SpelAwareProxyProjectionFactory;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;
import org.springframework.data.rest.core.mapping.ExposureConfiguration;
import org.springframework.data.rest.webmvc.config.RepositoryRestConfigurer;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class RepositoryConfiguration implements RepositoryRestConfigurer {

  @Override
  public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config, CorsRegistry cors) {
    // See https://github.com/spring-projects/spring-data-rest/issues/2023
    config.useHalAsDefaultJsonMediaType(false);
    config.exposeIdsFor(ImportedCodeSet.class);
    config.exposeIdsFor(ImportedCode.class);
    config.exposeIdsFor(Map.class);
    config.exposeIdsFor(MapRow.class);
    config.exposeIdsFor(MapRowTarget.class);
    config.exposeIdsFor(Task.class);
    config.exposeIdsFor(Project.class);
    config.exposeIdsFor(User.class);
    config.exposeIdsFor(Note.class);

    ExposureConfiguration exposureConfiguration = config.getExposureConfiguration();
    // only the system creates MapRows when a Map is created
    exposureConfiguration.forDomainType(MapRow.class)
        .disablePutForCreation()
        .withCollectionExposure((metadata, httpMethods) -> httpMethods.disable(HttpMethod.POST, HttpMethod.DELETE))
        .withItemExposure((metadata, httpMethods) -> httpMethods.disable(HttpMethod.POST, HttpMethod.DELETE));

    // User
    exposureConfiguration.forDomainType(User.class)
        .withCollectionExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE))
        .withItemExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE));

    // ImportedCodeSet (Source code file)
    exposureConfiguration.forDomainType(ImportedCodeSet.class)
        .withCollectionExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE))
        .withItemExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE));

    // ImportedCode (Source code) - created by the system when importedCodeSet created
    exposureConfiguration.forDomainType(ImportedCode.class)
        .withCollectionExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE))
        .withItemExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE));

    // Project
    exposureConfiguration.forDomainType(Project.class)
        .withCollectionExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.DELETE))
        .withItemExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.DELETE));

    // Map
    exposureConfiguration.forDomainType(Map.class)
        .withCollectionExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.DELETE))
        .withItemExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.DELETE));

    // MapRow - only the system creates MapRows when a Map is created
    exposureConfiguration.forDomainType(MapRow.class)
        .disablePutForCreation()
        .withCollectionExposure((metadata, httpMethods) -> httpMethods.disable(HttpMethod.POST, HttpMethod.DELETE))
        .withItemExposure((metadata, httpMethods) -> httpMethods.disable(HttpMethod.POST, HttpMethod.DELETE));

    // Note
    exposureConfiguration.forDomainType(Note.class)
        .withCollectionExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.DELETE))
        .withItemExposure(
            (metadata, httpMethods) -> httpMethods.disable(HttpMethod.PATCH, HttpMethod.DELETE));

  }

  @Bean
  ProjectEventHandler projectEventHandler() {
    return new ProjectEventHandler();
  }

  @Bean
  MapEventHandler mapEventHandler() {
    return new MapEventHandler();
  }

  @Bean
  MapRowEventHandler mapRowEventHandler() {
    return new MapRowEventHandler();
  }

  @Bean
  MapRowTargetEventHandler mapRowTargetEventHandler() {
    return new MapRowTargetEventHandler();
  }

  @Bean
  NoteEventHandler noteEventHandler() {
    return new NoteEventHandler();
  }

  @Bean
  TaskEventHandler taskEventHandler() {
    return new TaskEventHandler();
  }

  @Bean
  AuditorAware<String> auditorProvider() {
    return new Snap2SnomedAuditorAwareImpl();
  }

  @Bean
  public SpelAwareProxyProjectionFactory projectionFactory() {
    return new SpelAwareProxyProjectionFactory();
  }
}
