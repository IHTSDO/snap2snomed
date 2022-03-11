package org.snomed.snap2snomed.problem.task;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class NoSuchAssigneeProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public NoSuchAssigneeProblem() {
    super("no-such-assignee", "Assignee does not exist", Status.BAD_REQUEST,
        "The assignee does not exist, please create a user in this system and try again");
  }

}
