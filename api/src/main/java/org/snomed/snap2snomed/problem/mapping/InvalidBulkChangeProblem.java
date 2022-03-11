package org.snomed.snap2snomed.problem.mapping;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class InvalidBulkChangeProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public InvalidBulkChangeProblem(String detail) {
    super("invalid-bulk-change", "Invalid bulk change request", Status.BAD_REQUEST, detail);
  }

}
