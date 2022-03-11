package org.snomed.snap2snomed.validation;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapperImpl;

public class AtLeastOneNotNullValidator implements ConstraintValidator<AtLeastOneNotNull, Object> {

  private String[] fields;

  public void initialize(AtLeastOneNotNull constraintAnnotation) {
    this.fields = constraintAnnotation.fields();
  }

  @Override
  public boolean isValid(Object value, ConstraintValidatorContext context) {

    for (String field : fields) {
      if (new BeanWrapperImpl(value).getPropertyValue(field) != null) {
        return true;
      }
    }
    return false;
  }

}
