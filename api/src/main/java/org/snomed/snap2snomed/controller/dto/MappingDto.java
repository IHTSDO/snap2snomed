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

import lombok.Builder;
import lombok.Data;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.MappingRelationship;

@Data
@Builder(toBuilder = true)
public class MappingDto {

  private Long targetId;

  private Boolean noMap;

  private MapStatus status;

  private MappingRelationship relationship;

  private Boolean clearTarget;

  public boolean isNoMap() {
    return noMap != null && noMap;
  }

  public boolean isOnlyStatusChange() {
    return status != null && relationship == null && noMap == null && (clearTarget == null || !clearTarget);
  }

  public boolean isNoChange() {
    return noMap == null && status == null && relationship == null && clearTarget == null;
  }

  public boolean isValid() {
    return (noMap != null && status == null && relationship == null && clearTarget == null)
        || (noMap == null && (status != null || relationship != null) && clearTarget == null)
        || (noMap == null && status == null && relationship == null && clearTarget != null);
  }
}
