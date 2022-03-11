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

package org.snomed.snap2snomed.util;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.snomed.snap2snomed.controller.dto.IndexSpecification;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.repository.ImportedCodeRepository;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class SourceRowSpecificationBean {

  @Autowired
  MapRowRepository mapRowRepository;

  @Autowired
  ImportedCodeRepository importedCodeRepository;

  public Long calculateSourceRowCount(Task task) {
    List<Long> sourceIndexes = mapRowRepository.getSourceRowIndexesForTask(task);

    if (sourceIndexes.isEmpty()) {
      log.error("Task " + task.getId() + " has no source rows associated with it");
      return 0L;
    }

    IndexSpecification specification = IndexSpecification.of(sourceIndexes,
        importedCodeRepository.findLargestSourceIndexForCodeSet(task.getMap().getSource()));

    return specification.getCount();
  }

  public String calculateSourceRowSpecification(Task task) {
    if (task.getSourceRowSpecification() != null) {
      return task.getSourceRowSpecification();
    }

    List<Long> sourceIndexes = mapRowRepository.getSourceRowIndexesForTask(task);

    if (sourceIndexes.isEmpty()) {
      log.error("Task " + task.getId() + " has no source rows associated with it");
      return "";
    }

    IndexSpecification specification = IndexSpecification.of(sourceIndexes,
        importedCodeRepository.findLargestSourceIndexForCodeSet(task.getMap().getSource()));

    return specification.getSpecification();
  }
}
