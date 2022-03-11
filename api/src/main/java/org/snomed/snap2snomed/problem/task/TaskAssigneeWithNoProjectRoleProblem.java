package org.snomed.snap2snomed.problem.task;

import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class TaskAssigneeWithNoProjectRoleProblem extends Snap2SnomedProblem {

  public TaskAssigneeWithNoProjectRoleProblem(User user, Project project) {
    super("user-not-authorised-in-project",
        "User " + user.getFullName() + " does not have a role for project "
            + project.getTitle() + " and cannot be assigned tasks", Status.BAD_REQUEST);
  }
}
