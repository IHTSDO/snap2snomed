package org.snomed.snap2snomed.problem.mapping;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class UnauthorisedMappingProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  public UnauthorisedMappingProblem(String detail) {
    super("unauthorised-mapping-problem", "User is not authorised to update the mapping", Status.FORBIDDEN, detail);
  }

}
