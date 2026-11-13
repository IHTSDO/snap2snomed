/*
 * Copyright © 2026 SNOMED International
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

package org.snomed.snap2snomed.problem.config;

import java.util.List;
import org.springframework.http.ProblemDetail;

/**
 * Adds a root-level "violations" field to a ProblemDetail response, matching the shape previously
 * produced by problem-spring-web's ConstraintViolationAdviceTrait/MethodArgumentNotValidAdviceTrait.
 * Uses the ProblemDetail copy-constructor extension pattern rather than setProperty(), since a
 * genuine subclass field serializes as a real root-level JSON member instead of being nested
 * under a "properties" object.
 */
public class ValidationProblemDetail extends ProblemDetail {

  public record Violation(String field, String message) {
  }

  private final List<Violation> violations;

  public ValidationProblemDetail(ProblemDetail problemDetail, List<Violation> violations) {
    super(problemDetail);
    this.violations = violations;
  }

  public List<Violation> getViolations() {
    return violations;
  }
}
