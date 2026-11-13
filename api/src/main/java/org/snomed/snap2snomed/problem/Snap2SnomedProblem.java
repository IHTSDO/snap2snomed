/*
 * Copyright © 2022-2026 SNOMED International
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

package org.snomed.snap2snomed.problem;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Base class for domain-specific errors, rendered as RFC 9457 Problem Details via
 * {@link org.snomed.snap2snomed.problem.config.ExceptionHandler}. ExceptionHandler extends
 * ResponseEntityExceptionHandler, which already has built-in handling for ErrorResponseException,
 * so no subclass needs its own @ExceptionHandler method.
 */
public abstract class Snap2SnomedProblem extends ErrorResponseException {

  public static final String BASE_PROBLEM_TYPE_URI = "http://snap2snomed.app/problem/";

  private static final long serialVersionUID = 1L;

  protected Snap2SnomedProblem(String uriSubPath, String title, HttpStatus status, String detail) {
    this(status, buildBody(uriSubPath, title, status, detail));
  }

  protected Snap2SnomedProblem(String uriSubPath, String title, HttpStatus status) {
    this(uriSubPath, title, status, null);
  }

  protected Snap2SnomedProblem(HttpStatusCode status, ProblemDetail body) {
    super(status, body, null);
  }

  protected static ProblemDetail buildBody(String uriSubPath, String title, HttpStatus status, String detail) {
    ProblemDetail body = detail != null ? ProblemDetail.forStatusAndDetail(status, detail) : ProblemDetail.forStatus(status);
    body.setTitle(title);
    body.setType(toTypeUri(uriSubPath));
    return body;
  }

  public static URI toTypeUri(String uriSubPath) {
    return URI.create(BASE_PROBLEM_TYPE_URI + uriSubPath);
  }

  /**
   * Equivalent to Zalando's {@code Problem.valueOf(status, detail)}: an untyped (type "about:blank"),
   * ad-hoc error with the status's standard reason phrase as its title.
   */
  public static ErrorResponseException of(HttpStatus status, String detail) {
    ProblemDetail body = ProblemDetail.forStatusAndDetail(status, detail);
    body.setTitle(status.getReasonPhrase());
    return new ErrorResponseException(status, body, null);
  }
}
