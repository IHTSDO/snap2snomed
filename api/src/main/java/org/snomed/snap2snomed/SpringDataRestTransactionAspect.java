package org.snomed.snap2snomed;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Aspect
@Component
public class SpringDataRestTransactionAspect {

  private TransactionTemplate transactionTemplate;

  public SpringDataRestTransactionAspect(PlatformTransactionManager transactionManager) {
    this.transactionTemplate = new TransactionTemplate(transactionManager);
    this.transactionTemplate.setName("around-data-rest-transaction");
  }

  @Pointcut("execution(* org.springframework.data.rest.webmvc.Repository*Controller.*(..))")
  public void aroundDataRestCall() {
  }

  @Around("aroundDataRestCall()")
  public Object aroundDataRestCall(ProceedingJoinPoint joinPoint) throws Throwable {
    return transactionTemplate.execute(transactionStatus -> {
      try {
        return joinPoint.proceed();
      } catch (Throwable e) {
        transactionStatus.setRollbackOnly();
        if (e instanceof Exception) {
          throw new TransactionAspectWrappedException(e);
        } else {
          throw new RuntimeException(e);
        }
      }
    }
    );
  }

  public class TransactionAspectWrappedException extends RuntimeException {

    public TransactionAspectWrappedException(Throwable e) {
      super(e);
    }
  }
}
