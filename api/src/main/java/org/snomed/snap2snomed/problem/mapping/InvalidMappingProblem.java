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
