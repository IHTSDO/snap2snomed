package org.snomed.snap2snomed.problem.task;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class TaskDeletProblem extends Snap2SnomedProblem {

  public TaskDeletProblem(String subUrl, String message, Status status) {
    super("task-delete/" + subUrl, "Task cannot be deleted", status, message);
  }
}
