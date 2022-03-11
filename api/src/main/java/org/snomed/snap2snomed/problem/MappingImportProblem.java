package org.snomed.snap2snomed.problem;

import org.zalando.problem.Status;

public class MappingImportProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  private static final String BASE_TYPE = "mapping-import/";

  public MappingImportProblem(String subtype, String title, String detail) {
    super(BASE_TYPE + subtype, title, Status.BAD_REQUEST, detail);
  }

  public MappingImportProblem(String subtype, String title) {
    this(subtype, title, null);
  }
}
