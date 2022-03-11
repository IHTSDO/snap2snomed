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
