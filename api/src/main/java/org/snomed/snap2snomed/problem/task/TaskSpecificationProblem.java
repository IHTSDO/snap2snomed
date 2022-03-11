package org.snomed.snap2snomed.problem.task;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class TaskSpecificationProblem extends Snap2SnomedProblem {

  public TaskSpecificationProblem(String detail) {
    super("task-specification-problem",
        "Specified set of rows for the task are invalid.", Status.BAD_REQUEST, detail);
  }
}
