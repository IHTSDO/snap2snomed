package org.snomed.snap2snomed.problem.mapping;

import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.zalando.problem.Status;

public class DeleteMapProblem extends Snap2SnomedProblem {

  public DeleteMapProblem(String subUrl, String message, Status status) {
    super("mapping-delete/" + subUrl, "Map cannot be deleted", status, message);
  }
}