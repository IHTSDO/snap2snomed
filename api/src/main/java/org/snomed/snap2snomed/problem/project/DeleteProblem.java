package org.snomed.snap2snomed.problem.project;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class DeleteProblem extends Snap2SnomedProblem {

  public DeleteProblem(String subUrl, String message, Status status) {
    super("project-delete/" + subUrl, "Project cannot be deleted", status, message);
  }
}
