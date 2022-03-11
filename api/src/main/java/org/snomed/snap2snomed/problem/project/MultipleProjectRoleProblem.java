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
