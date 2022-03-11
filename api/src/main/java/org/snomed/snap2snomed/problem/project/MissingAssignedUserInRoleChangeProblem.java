package org.snomed.snap2snomed.problem.project;

import java.util.Set;
import java.util.stream.Collectors;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class MissingAssignedUserInRoleChangeProblem extends Snap2SnomedProblem {

  public MissingAssignedUserInRoleChangeProblem(Set<User> assignedUsers) {
    super("missing-assigned-users-in-role-change",
        "Users assigned to active tasks cannot be removed from project roles.", Status.BAD_REQUEST,
        "The users " + assignedUsers.stream().map(u -> u.getFullName())
            .collect(Collectors.joining(", "))
            + " currently have active tasks but an attempt was made to remove them from the project.");
  }
}
