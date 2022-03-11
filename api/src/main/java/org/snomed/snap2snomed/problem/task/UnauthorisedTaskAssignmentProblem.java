package org.snomed.snap2snomed.problem.task;

import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class UnauthorisedTaskAssignmentProblem extends Snap2SnomedProblem {

  public UnauthorisedTaskAssignmentProblem(User user, User assignee, Project project, String detail) {
    super("unauthorised-task-assignment",
        "User " + user.getFullName() + " is not authorised to assign a task to " + assignee.getFullName() + " in project "
            + project.getTitle(), Status.FORBIDDEN, detail);
  }
}
