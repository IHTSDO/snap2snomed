package org.snomed.snap2snomed.model.enumeration;

import lombok.Getter;

@Getter
public enum MappingRelationship {
  TARGET_EQUIVALENT("Target is equivalent to source"), TARGET_NARROWER("Target is narrower than source"), TARGET_BROADER(
      "Target is broader than source"), TARGET_INEXACT("Target is an inexact match to source");

  public final String label;

  private MappingRelationship(String label) {
      this.label = label;
  }
}
