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

import javax.validation.constraints.NotNull;
import org.hibernate.validator.constraints.URL;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TerminologyServerConfiguration {
  @NotNull
  @URL(regexp = "^(http|https).*")
  String url;

  /**
   * The max size of each batch that will be sent to the expand operation.
   * expandBatchSize should be no larger than the THRESHOLD of the expand operation.
   * Values less than the THRESHOLD could give better performance if the requests are run in parallel.
   */
  @NotNull
  Integer expandBatchSize ;
}
