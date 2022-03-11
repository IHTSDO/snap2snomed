package org.snomed.snap2snomed.problem.auth;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class NotAuthorisedProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public NotAuthorisedProblem(String message) {
    super("not-authorised", "Not Authorised", Status.FORBIDDEN, message);
  }

}
