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

package org.snomed.snap2snomed.problem.task;

import com.google.common.collect.Sets;
import java.util.Set;
import lombok.Data;
import org.snomed.snap2snomed.controller.dto.IndexSpecification;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

@Data
public class TaskSpecificationContainsUnassignableRowsProblem extends Snap2SnomedProblem {

  IndexSpecification indexesWithExistingTask;
  IndexSpecification indexesWithRoleConflict;
  IndexSpecification originalIndexSpecification;
  IndexSpecification indexSpecificationWithRoleConflictsRemoved;
  IndexSpecification indexSpecificationWithExistingTaskConflictsRemoved;
  IndexSpecification indexSpecificationWithAllConflictsRemoved;
  int indexCountWithRoleConflict;
  int indexCountWithExistingTaskConflict;
  int indexCountWithRoleAndExistingTaskConflict;

  public TaskSpecificationContainsUnassignableRowsProblem(
      Set<Long> indexesWithExistingTask,
      Set<Long> indexesWithRoleConflict,
      String originalIndexSpecification,
      Long totalCodesInCodeSystem) {
    super("task-specification-containse-unassignable-rows",
        "Task row specification contains rows which cannot be assigned to a task by this user", Status.BAD_REQUEST);

    this.indexesWithExistingTask = IndexSpecification.of(indexesWithExistingTask, totalCodesInCodeSystem);
    this.indexesWithRoleConflict = IndexSpecification.of(indexesWithRoleConflict, totalCodesInCodeSystem);
    this.originalIndexSpecification = IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem);
    this.indexSpecificationWithRoleConflictsRemoved = IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem,
        indexesWithRoleConflict);
    this.indexSpecificationWithExistingTaskConflictsRemoved = IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem,
        indexesWithExistingTask);
    this.indexSpecificationWithAllConflictsRemoved = IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem,
        indexesWithExistingTask, indexesWithRoleConflict);
    this.indexCountWithRoleConflict = indexesWithRoleConflict.size();
    this.indexCountWithExistingTaskConflict = indexesWithExistingTask.size();
    this.indexCountWithRoleAndExistingTaskConflict = Sets.intersection(indexesWithExistingTask, indexesWithRoleConflict).size();
  }
}
