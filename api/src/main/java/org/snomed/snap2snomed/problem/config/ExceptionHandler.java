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

package org.snomed.snap2snomed.problem.config;

import java.net.URI;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import io.sentry.spring7.SentryExceptionResolver;
import lombok.extern.slf4j.Slf4j;
import org.snomed.snap2snomed.SpringDataRestTransactionAspect.TransactionAspectWrappedException;
import org.snomed.snap2snomed.problem.config.ValidationProblemDetail.Violation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Central error-handling advice. Replaces problem-spring-web's ProblemHandling /
 * ConstraintViolationAdviceTrait / SecurityAdviceTrait with Spring's native RFC 9457 ProblemDetail
 * support: ResponseEntityExceptionHandler already handles every Snap2SnomedProblem subclass (they
 * are all ErrorResponseException) plus the standard Spring MVC exceptions (404, 405, malformed
 * body, etc.), so only the handlers below are needed for everything else problem-spring-web used
 * to cover.
 */
@ControllerAdvice
@Slf4j
public class ExceptionHandler extends ResponseEntityExceptionHandler {

  private static final URI CONSTRAINT_VIOLATION_TYPE = URI.create("https://zalando.github.io/problem/constraint-violation");

  @Autowired(required = false)
  private SentryExceptionResolver sentryExceptionResolver;

  /**
   * Single funnel point every handled exception passes through - equivalent to
   * problem-spring-web's ProblemHandling.log() hook, used to forward 5xx errors to Sentry.
   */
  @Override
  protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
      HttpStatusCode statusCode, WebRequest request) {
    if (statusCode.is5xxServerError() && sentryExceptionResolver != null) {
      NativeWebRequest nativeRequest = (NativeWebRequest) request;
      sentryExceptionResolver.resolveException(
          Objects.requireNonNull(nativeRequest.getNativeRequest(HttpServletRequest.class)),
          Objects.requireNonNull(nativeRequest.getNativeResponse(HttpServletResponse.class)),
          null,
          ex);
    }
    return super.handleExceptionInternal(ex, body, headers, statusCode, request);
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
      HttpStatusCode status, WebRequest request) {
    List<Violation> violations = ex.getBindingResult().getAllErrors().stream()
        .map(error -> new Violation(error instanceof FieldError fieldError ? fieldError.getField() : objectName(error),
            error.getDefaultMessage()))
        .collect(Collectors.toList());
    return handleExceptionInternal(ex, constraintViolationBody(violations), headers, HttpStatus.BAD_REQUEST, request);
  }

  private static String objectName(ObjectError error) {
    return error.getObjectName();
  }

  @org.springframework.web.bind.annotation.ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<Object> handleConstraintViolation(ConstraintViolationException ex, WebRequest request) {
    // When a field fails more than one constraint (e.g. both @NotBlank and a custom-message @Size),
    // Hibernate Validator's iteration order is unspecified. Sort violations using a custom literal
    // message ahead of ones falling back to a constraint's generic default "{...}" message template,
    // so the more specific, developer-authored message is what callers see first.
    List<Violation> violations = ex.getConstraintViolations().stream()
        .sorted(Comparator.comparing(ExceptionHandler::usesDefaultMessageTemplate))
        .map(cv -> new Violation(lastPathNode(cv), cv.getMessage()))
        .collect(Collectors.toList());
    return handleExceptionInternal(ex, constraintViolationBody(violations), new HttpHeaders(), HttpStatus.BAD_REQUEST, request);
  }

  private static boolean usesDefaultMessageTemplate(ConstraintViolation<?> cv) {
    String template = cv.getMessageTemplate();
    return template != null && template.startsWith("{") && template.endsWith("}");
  }

  private static ValidationProblemDetail constraintViolationBody(List<Violation> violations) {
    ProblemDetail body = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    body.setTitle("Constraint Violation");
    // Preserve the existing API contract from problem-spring-web's ConstraintViolationProblem,
    // which the frontend and integration tests already depend on to identify validation errors.
    body.setType(CONSTRAINT_VIOLATION_TYPE);
    return new ValidationProblemDetail(body, violations);
  }

  private static String lastPathNode(ConstraintViolation<?> cv) {
    return StreamSupport.stream(cv.getPropertyPath().spliterator(), false)
        .reduce((first, second) -> second)
        .map(Path.Node::getName)
        .orElse(cv.getPropertyPath().toString());
  }

  @org.springframework.web.bind.annotation.ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Object> handleDataIntegrityViolation(DataIntegrityViolationException ex, WebRequest request) {
    ProblemDetail body = ProblemDetail.forStatus(HttpStatus.CONFLICT);
    body.setTitle("Integrity violation");
    body.setType(URI.create("/problem/integrity-constraint"));
    return handleExceptionInternal(ex, body, new HttpHeaders(), HttpStatus.CONFLICT, request);
  }

  @org.springframework.web.bind.annotation.ExceptionHandler(TransactionSystemException.class)
  public ResponseEntity<Object> handleTransactionSystemException(TransactionSystemException ex, WebRequest request)
      throws Exception {
    Throwable rootCause = ex.getRootCause();
    if (rootCause instanceof ConstraintViolationException constraintViolationException) {
      return handleConstraintViolation(constraintViolationException, request);
    } else if (rootCause instanceof Exception rootCauseException) {
      return handleException(rootCauseException, request);
    } else {
      return handleExceptionInternal(ex, null, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR, request);
    }
  }

  @org.springframework.web.bind.annotation.ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
    ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
    return handleExceptionInternal(ex, body, new HttpHeaders(), HttpStatus.FORBIDDEN, request);
  }

  @org.springframework.web.bind.annotation.ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<Object> handleAuthentication(AuthenticationException ex, WebRequest request) {
    ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
    return handleExceptionInternal(ex, body, new HttpHeaders(), HttpStatus.UNAUTHORIZED, request);
  }

  /*
   * OK this is a bit strange, but what's happening here is that to wrap a transaction around the Spring Data Rest
   * repository event handler calls an aspect was used. That aspect needs to call set rollback only if something is
   * thrown, so it must catch Throwable. However after doing that it wants to hand on the exception to get handled
   * with an appropriate REST response. So it creates a TransactionAspectWrappedException if the exception is a
   * type of Exception (not Throwable) and this method unwraps it and re-dispatches to whichever handler applies
   * to the underlying exception's type.
   *
   * If this wasn't here, basically all errors would report as 500 internal server error even though the wrapped
   * exception has the detail to explain what really happened. Not ideal, but a cost of using the aspect.
   */
  @org.springframework.web.bind.annotation.ExceptionHandler(TransactionAspectWrappedException.class)
  public ResponseEntity<Object> handleTransactionAspectException(TransactionAspectWrappedException ex, WebRequest request)
      throws Exception {
    Throwable cause = ex.getCause();
    if (cause instanceof ConstraintViolationException constraintViolationException) {
      return handleConstraintViolation(constraintViolationException, request);
    } else if (cause instanceof DataIntegrityViolationException dataIntegrityViolationException) {
      return handleDataIntegrityViolation(dataIntegrityViolationException, request);
    } else if (cause instanceof AccessDeniedException accessDeniedException) {
      return handleAccessDenied(accessDeniedException, request);
    } else if (cause instanceof AuthenticationException authenticationException) {
      return handleAuthentication(authenticationException, request);
    } else if (cause instanceof ErrorResponseException || cause instanceof Exception) {
      // Covers every Snap2SnomedProblem subclass plus all of Spring MVC's own built-in exceptions.
      return handleException((Exception) cause, request);
    } else {
      throw new IllegalStateException("Unhandleable throwable wrapped by transaction aspect", cause);
    }
  }
}
