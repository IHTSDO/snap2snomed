package org.snomed.snap2snomed.problem;

import org.zalando.problem.Status;

public class BadRequestDataProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  private static final String BASE_TYPE = "bad-request-data/";

  public BadRequestDataProblem(String detail) {
    super(BASE_TYPE, "Bad request data", Status.BAD_REQUEST, detail);
  }
}
