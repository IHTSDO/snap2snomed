package org.snomed.snap2snomed.problem.auth;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class MissingJwtProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public MissingJwtProblem() {
    super("missing-jwt", "Missing JWT token", Status.UNAUTHORIZED);
  }

}
