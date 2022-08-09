package org.snomed.snap2snomed.problem;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class DeleteProblem extends Snap2SnomedProblem {

  public DeleteProblem(String subUrl, String message, Status status) {
    super("delete/" + subUrl, "Cannot be deleted", status, message);
  }
}
