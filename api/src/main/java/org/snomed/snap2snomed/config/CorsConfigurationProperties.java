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

package org.snomed.snap2snomed.config;

import java.util.List;

import javax.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CorsConfigurationProperties {
  /**
   *  Allowed origings for CORS
   */
  @NotNull
  List<String> allowedOriginPatterns;

  /**
   *  Allowed Headers for CORS
   */
  @NotNull
  List<String> allowedHeaders;

  /**
   *  Allowed Methods for CORS
   */
  @NotNull
  List<String> allowedMethods;

  /**
   *  MaxAge config for CORS
   */
  @NotNull
  Long maxAge;

  /**
   *  Allow Credentials config for CORS
   */
  Boolean allowCredentials;

  /**
   *  Allowed Methods for CORS
   */
  List<String> exposeHeaders;
}
