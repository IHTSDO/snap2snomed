package org.snomed.snap2snomed.problem.project;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class CannotDeleteLastOwnerProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public CannotDeleteLastOwnerProblem() {
    super("cannot-delete-last-owner", "A project must have an owner, the last owner cannot be deleted", Status.BAD_REQUEST);
  }
}
