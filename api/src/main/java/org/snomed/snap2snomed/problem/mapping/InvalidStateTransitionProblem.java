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
