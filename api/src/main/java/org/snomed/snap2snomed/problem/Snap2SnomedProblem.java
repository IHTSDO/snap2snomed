package org.snomed.snap2snomed.problem;

import java.net.URI;
import org.zalando.problem.AbstractThrowableProblem;
import org.zalando.problem.Status;

public abstract class Snap2SnomedProblem extends AbstractThrowableProblem {

  public static final String BASE_PROBLEM_TYPE_URI = "http://snap2snomed.app/problem/";

  private static final long serialVersionUID = 1L;

  public Snap2SnomedProblem(String uriSubPath, String title, Status status, String detail) {
    super(toTypeUri(uriSubPath), title, status, detail);
  }

  public Snap2SnomedProblem(String uriSubPath, String title, Status status) {
    this(uriSubPath, title, status, null);
  }

  protected static URI toTypeUri(String subtype) {
    return URI.create(BASE_PROBLEM_TYPE_URI + subtype);
  }
}
