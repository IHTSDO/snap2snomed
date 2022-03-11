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

import io.sentry.spring.SentryExceptionResolver;
import java.util.Objects;
import javax.annotation.Nonnull;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.snomed.snap2snomed.SpringDataRestTransactionAspect.TransactionAspectWrappedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.annotation.ExceptionHandlerMethodResolver;
import org.zalando.problem.Problem;
import org.zalando.problem.spring.web.advice.ProblemHandling;
import org.zalando.problem.spring.web.advice.security.SecurityAdviceTrait;
import org.zalando.problem.spring.web.advice.validation.OpenApiValidationAdviceTrait;

@ControllerAdvice
@Slf4j
public class ExceptionHandler implements ProblemHandling, OpenApiValidationAdviceTrait,
    CustomAdviceTrait, SecurityAdviceTrait {

  private static ExceptionHandlerMethodResolver resolver = new ExceptionHandlerMethodResolver(ExceptionHandler.class);

  @Autowired
  private SentryExceptionResolver sentryExceptionResolver;

  @Override
  public void log(@Nonnull Throwable throwable, @Nonnull Problem problem,
      @Nonnull NativeWebRequest request, @Nonnull HttpStatus status) {
    if (status.is5xxServerError()) {
      if (throwable instanceof Exception) {
        // This intercepts any exceptions relating to a 500 status and uses the Sentry resolver
        // to report them as events.
        sentryExceptionResolver
            .resolveException(
                Objects.requireNonNull(request.getNativeRequest(HttpServletRequest.class)),
                Objects.requireNonNull(request.getNativeResponse(HttpServletResponse.class)),
                null,
                (Exception) throwable
            );
      }
    }
    CustomAdviceTrait.super.log(throwable, problem, request, status);
  }

  /*
   * OK this is a bit strange, but what's happening here is that to wrap a transaction around the Spring Data Rest
   * repository event handler calls an aspect was used. That aspect needs to call set rollback only if something is
   * thrown, so it must catch Throwable. However after doing that it wants to hand on the exception to get handled
   * with an appropriate REST response. So it creates a TransactionAspectWrappedException if the exception is a
   * type of Exception (not Throwable) and this method handles that except, unwraps it, and then uses some reflection
   * to then push that exception through the normal handling stack.
   *
   * If this wasn't here, basically all errors would report as 500 internal server error even though the wrapped
   * exception has the detail to explain what really happened. Not ideal, but a cost of using the aspect.
   */
  @org.springframework.web.bind.annotation.ExceptionHandler
  public Object handleTransactionAspectException(final TransactionAspectWrappedException exception,
      final NativeWebRequest request) {
    try {
      return resolver.resolveMethod((Exception) exception.getCause()).invoke(this, exception.getCause(), request);
    } catch (Exception e) {
      return handleThrowable(e, request);
    }
  }
}
