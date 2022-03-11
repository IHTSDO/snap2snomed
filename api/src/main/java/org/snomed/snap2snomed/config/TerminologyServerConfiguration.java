package org.snomed.snap2snomed.config;

import javax.validation.constraints.NotNull;
import org.hibernate.validator.constraints.URL;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TerminologyServerConfiguration {
  @NotNull
  @URL(regexp = "^(http|https).*")
  String url;
}
