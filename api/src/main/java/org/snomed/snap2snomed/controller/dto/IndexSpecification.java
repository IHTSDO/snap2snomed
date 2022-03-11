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

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.Data;
import org.apache.commons.lang3.tuple.Pair;
import org.snomed.snap2snomed.util.SourceRowSpecificationUtils;

@Data
public class IndexSpecification {

  String specification;
  long count;

  public static IndexSpecification of(Collection<Long> indexes, Long totalCodesInCodeSystem) {
    IndexSpecification spec = new IndexSpecification();
    if (!indexes.isEmpty()) {
      Pair<String, Long> specification = SourceRowSpecificationUtils.calculateSpecification(indexes, totalCodesInCodeSystem);
      spec.specification = specification.getLeft();
      spec.count = specification.getRight();
    }
    return spec;
  }

  public static IndexSpecification of(String originalIndexSpecification, Long totalCodesInCodeSystem) {
    return IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem, null);
  }

  public static IndexSpecification of(String originalIndexSpecification, Long totalCodesInCodeSystem,
      Set<Long>... subtractions) {
    IndexSpecification spec = new IndexSpecification();
    Set<Long> combinedSubstractions =
        subtractions == null ? null : Stream.of(subtractions).flatMap(x -> x.stream()).collect(Collectors.toSet());
    Pair<String, Long> specification = SourceRowSpecificationUtils.calculateSpecification(originalIndexSpecification,
        totalCodesInCodeSystem, combinedSubstractions);
    spec.specification = specification.getLeft();
    spec.count = specification.getRight();
    return spec;
  }
}