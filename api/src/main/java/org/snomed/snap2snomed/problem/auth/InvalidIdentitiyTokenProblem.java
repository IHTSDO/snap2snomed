package org.snomed.snap2snomed.problem.auth;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class InvalidIdentitiyTokenProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public InvalidIdentitiyTokenProblem(Exception e) {
    super("invalid-id-token", "Invalid identity token", Status.BAD_REQUEST, e.getLocalizedMessage());
  }

}
