package org.snomed.snap2snomed.problem.auth;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class NoSuchUserProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public NoSuchUserProblem() {
    super("no-such-user", "User does not exist", Status.UNAUTHORIZED,
        "The authenticated user does not exist, please create a user in this system and try again");
  }

}
