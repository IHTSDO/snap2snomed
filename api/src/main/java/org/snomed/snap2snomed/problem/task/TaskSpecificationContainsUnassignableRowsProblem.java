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
