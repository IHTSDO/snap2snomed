/*
 * Copyright © 2026 SNOMED International
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

package org.snomed.snap2snomed.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.hibernate7.Hibernate7Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

@Configuration
public class JacksonConfiguration {

  @Bean
  public Hibernate7Module hibernate7Module() {
    Hibernate7Module module = new Hibernate7Module();
    // USE_TRANSIENT_ANNOTATION skips @Transient fields during deserialization,
    // breaking task creation (sourceRowSpecification etc. are @Transient but needed).
    module.disable(Hibernate7Module.Feature.USE_TRANSIENT_ANNOTATION);
    // FORCE_LAZY_LOADING restores pre-module behaviour: lazy collections/associations
    // (e.g. Project.owners/members/guests) are loaded by Hibernate during serialization
    // rather than being returned as null by the module.
    module.enable(Hibernate7Module.Feature.FORCE_LAZY_LOADING);
    return module;
  }

  // Spring Boot 4's JacksonAutoConfiguration defaults to a Jackson 3 JsonMapper and no longer
  // exposes a Jackson2ObjectMapperBuilder bean at all; this app's code is built entirely on the
  // Jackson 2 API, so the ObjectMapper it needs has to be hand-wired back in.
  @Bean
  public ObjectMapper objectMapper() {
    return Jackson2ObjectMapperBuilder.json()
        // Restores auto-registration of ParameterNamesModule/JavaTimeModule/etc.; without this,
        // constructor-only DTOs with no default constructor (e.g. ValidationResult) fail to deserialize.
        .findModulesViaServiceLoader(true)
        // Spring Data REST creates entities via no-args constructor + JSON merge; an omitted
        // primitive field (e.g. Note.deleted) would otherwise fail the merge.
        .featuresToDisable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
        .build();
  }

}
