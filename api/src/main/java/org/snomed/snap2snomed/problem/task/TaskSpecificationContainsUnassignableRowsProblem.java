/*
 * Copyright © 2022-2026 SNOMED International
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
import org.snomed.snap2snomed.controller.dto.IndexSpecification;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

public class TaskSpecificationContainsUnassignableRowsProblem extends Snap2SnomedProblem {

  private static final String URI_SUB_PATH = "task-specification-containse-unassignable-rows";
  private static final String TITLE =
      "Task row specification contains rows which cannot be assigned to a task by this user";

  public TaskSpecificationContainsUnassignableRowsProblem(
      Set<Long> indexesWithExistingTask,
      Set<Long> indexesWithRoleConflict,
      String originalIndexSpecification,
      Long totalCodesInCodeSystem) {
    super(HttpStatus.BAD_REQUEST,
        buildDetail(indexesWithExistingTask, indexesWithRoleConflict, originalIndexSpecification, totalCodesInCodeSystem));
  }

  private static Detail buildDetail(Set<Long> indexesWithExistingTask, Set<Long> indexesWithRoleConflict,
      String originalIndexSpecification, Long totalCodesInCodeSystem) {
    ProblemDetail base = buildBody(URI_SUB_PATH, TITLE, HttpStatus.BAD_REQUEST, null);
    return new Detail(base,
        IndexSpecification.of(indexesWithExistingTask, totalCodesInCodeSystem),
        IndexSpecification.of(indexesWithRoleConflict, totalCodesInCodeSystem),
        IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem),
        IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem, indexesWithRoleConflict),
        IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem, indexesWithExistingTask),
        IndexSpecification.of(originalIndexSpecification, totalCodesInCodeSystem, indexesWithExistingTask, indexesWithRoleConflict),
        indexesWithRoleConflict.size(),
        indexesWithExistingTask.size(),
        Sets.intersection(indexesWithExistingTask, indexesWithRoleConflict).size());
  }

  /**
   * Extra root-level JSON fields, matching the shape problem-spring-web previously produced by
   * flattening Lombok-generated bean getters directly onto the Problem object. A genuine subclass
   * field serializes as a real sibling JSON member; ProblemDetail.setProperty() would instead nest
   * these under a "properties" sub-object, breaking the existing API contract relied on by the UI.
   */
  public static final class Detail extends ProblemDetail {

    private final IndexSpecification indexesWithExistingTask;
    private final IndexSpecification indexesWithRoleConflict;
    private final IndexSpecification originalIndexSpecification;
    private final IndexSpecification indexSpecificationWithRoleConflictsRemoved;
    private final IndexSpecification indexSpecificationWithExistingTaskConflictsRemoved;
    private final IndexSpecification indexSpecificationWithAllConflictsRemoved;
    private final int indexCountWithRoleConflict;
    private final int indexCountWithExistingTaskConflict;
    private final int indexCountWithRoleAndExistingTaskConflict;

    private Detail(ProblemDetail base,
        IndexSpecification indexesWithExistingTask,
        IndexSpecification indexesWithRoleConflict,
        IndexSpecification originalIndexSpecification,
        IndexSpecification indexSpecificationWithRoleConflictsRemoved,
        IndexSpecification indexSpecificationWithExistingTaskConflictsRemoved,
        IndexSpecification indexSpecificationWithAllConflictsRemoved,
        int indexCountWithRoleConflict,
        int indexCountWithExistingTaskConflict,
        int indexCountWithRoleAndExistingTaskConflict) {
      super(base);
      this.indexesWithExistingTask = indexesWithExistingTask;
      this.indexesWithRoleConflict = indexesWithRoleConflict;
      this.originalIndexSpecification = originalIndexSpecification;
      this.indexSpecificationWithRoleConflictsRemoved = indexSpecificationWithRoleConflictsRemoved;
      this.indexSpecificationWithExistingTaskConflictsRemoved = indexSpecificationWithExistingTaskConflictsRemoved;
      this.indexSpecificationWithAllConflictsRemoved = indexSpecificationWithAllConflictsRemoved;
      this.indexCountWithRoleConflict = indexCountWithRoleConflict;
      this.indexCountWithExistingTaskConflict = indexCountWithExistingTaskConflict;
      this.indexCountWithRoleAndExistingTaskConflict = indexCountWithRoleAndExistingTaskConflict;
    }

    public IndexSpecification getIndexesWithExistingTask() {
      return indexesWithExistingTask;
    }

    public IndexSpecification getIndexesWithRoleConflict() {
      return indexesWithRoleConflict;
    }

    public IndexSpecification getOriginalIndexSpecification() {
      return originalIndexSpecification;
    }

    public IndexSpecification getIndexSpecificationWithRoleConflictsRemoved() {
      return indexSpecificationWithRoleConflictsRemoved;
    }

    public IndexSpecification getIndexSpecificationWithExistingTaskConflictsRemoved() {
      return indexSpecificationWithExistingTaskConflictsRemoved;
    }

    public IndexSpecification getIndexSpecificationWithAllConflictsRemoved() {
      return indexSpecificationWithAllConflictsRemoved;
    }

    public int getIndexCountWithRoleConflict() {
      return indexCountWithRoleConflict;
    }

    public int getIndexCountWithExistingTaskConflict() {
      return indexCountWithExistingTaskConflict;
    }

    public int getIndexCountWithRoleAndExistingTaskConflict() {
      return indexCountWithRoleAndExistingTaskConflict;
    }
  }
}
