/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
