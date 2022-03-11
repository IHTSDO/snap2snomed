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

package org.snomed.snap2snomed.problem.mapping;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class InvalidMappingProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public InvalidMappingProblem(String className, Long id) {
    super("invalid-" + className.toLowerCase() + "-id", "Cannot find "
        + className + " with id " + id, Status.BAD_REQUEST);
  }

  public InvalidMappingProblem(String detail) {
    super("invalid-mapping-input", "Invalid mapping input was provided", Status.BAD_REQUEST, detail);
  }

  public InvalidMappingProblem(String problem, String message) {
    super(problem, message, Status.BAD_REQUEST);
  }

}
