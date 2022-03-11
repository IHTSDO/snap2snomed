package org.snomed.snap2snomed.problem.project;

import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class MultipleProjectRoleProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public MultipleProjectRoleProblem(User user, String role1, String role2) {
    super("user-multiple-project-role", "A user can only hold one project role at a time", Status.BAD_REQUEST,
        "The user " + user.getGivenName() + " " + user.getFamilyName() + " cannot be added to the roles " + role1 + " and " + role2
            + " at the same time. Remove the user from one of these roles before adding them to the new role.");
  }
}
