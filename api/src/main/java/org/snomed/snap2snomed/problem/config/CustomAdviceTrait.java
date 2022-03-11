/*
 * Copyright © 2022 SNOMED International
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
import javax.validation.ConstraintViolationException;
import org.snomed.snap2snomed.problem.mapping.InvalidStateTransitionProblem;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.context.request.NativeWebRequest;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;
import org.zalando.problem.spring.web.advice.validation.ConstraintViolationAdviceTrait;

public interface CustomAdviceTrait extends ConstraintViolationAdviceTrait {
  @org.springframework.web.bind.annotation.ExceptionHandler
  default ResponseEntity<Problem> handleCustomException(final TransactionSystemException exception, final NativeWebRequest request) {

    ResponseEntity<Problem> response;

    if (exception.getRootCause() instanceof ConstraintViolationException) {
      response = handleConstraintViolation((ConstraintViolationException) exception.getRootCause(), request);
    } else if (exception.getRootCause() instanceof InvalidStateTransitionProblem) {
      response = create((InvalidStateTransitionProblem) exception.getRootCause(), request);
    } else {
      response = create(Status.INTERNAL_SERVER_ERROR, exception, request);
    }

    return response;
  }

  @org.springframework.web.bind.annotation.ExceptionHandler
  default ResponseEntity<Problem> handleCustomException(final DataIntegrityViolationException exception, final NativeWebRequest request) {
    Problem problem = Problem.builder().withStatus(Status.CONFLICT).withTitle("Integrity violation")
        .withType(URI.create("/problem/integrity-constraint")).build();

    return new ResponseEntity<Problem>(problem, HttpStatus.CONFLICT);
  }
}
