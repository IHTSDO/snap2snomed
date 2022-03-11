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

public class TaskAssigneeWithNoProjectRoleProblem extends Snap2SnomedProblem {

  public TaskAssigneeWithNoProjectRoleProblem(User user, Project project) {
    super("user-not-authorised-in-project",
        "User " + user.getFullName() + " does not have a role for project "
            + project.getTitle() + " and cannot be assigned tasks", Status.BAD_REQUEST);
  }
}
