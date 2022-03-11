package org.snomed.snap2snomed.problem;

import org.zalando.problem.Status;

public class CodeSetImportProblem extends Snap2SnomedProblem {

  private static final long serialVersionUID = 1L;

  private static final String BASE_TYPE = "codeset-import/";

  public CodeSetImportProblem(String subtype, String title, String detail) {
    super(BASE_TYPE + subtype, title, Status.BAD_REQUEST, detail);
  }

  public CodeSetImportProblem(String subtype, String title) {
    this(subtype, title, null);
  }

}
