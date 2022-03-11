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

import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class InvalidStateTransitionProblem extends Snap2SnomedProblem {
 
  private static final long serialVersionUID = 1L;

  public InvalidStateTransitionProblem(MapStatus curState, MapStatus newState) {
    super("invalid-state-transition", "State transisition from [" + curState +
          "] to [" + newState + "] is invalid", Status.BAD_REQUEST);
  }
    
  public InvalidStateTransitionProblem(String message) {
    super("invalid-state-transition", message, Status.BAD_REQUEST);
  }
}
