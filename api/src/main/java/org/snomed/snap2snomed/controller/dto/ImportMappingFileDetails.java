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

package org.snomed.snap2snomed.controller.dto;

import javax.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ImportMappingFileDetails {

  @NotNull(message = "An index for the codes in a mapping import file must be specified")
  Integer codeColumnIndex;

  @NotNull(message = "An index for the target codes column in a mapping import file must be specified")
  Integer targetCodeColumnIndex;

  @NotNull(message = "An index for the target display column in a mapping import file must be specified")
  Integer targetDisplayColumnIndex;

  @NotNull(message = "An index for the relationship column in a mapping import file must be specified")
  Integer relationshipColumnIndex;

  @NotNull(message = "ID of the map for the targets")
  String mapId;

  Character delimiter;

  Boolean hasHeader = false;

}
