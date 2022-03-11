package org.snomed.snap2snomed.problem.auth;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class MissingJwtSubjectProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public MissingJwtSubjectProblem() {
    super("missing-jwt-subject", "Missing Subject in JWT token", Status.UNAUTHORIZED);
  }

}
