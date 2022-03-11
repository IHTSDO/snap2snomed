package org.snomed.snap2snomed.config;

import java.util.List;

import javax.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CorsConfigurationProperties {
  /**
   *  Allowed origings for CORS
   */
  @NotNull
  List<String> allowedOriginPatterns;

  /**
   *  Allowed Headers for CORS
   */
  @NotNull
  List<String> allowedHeaders;

  /**
   *  Allowed Methods for CORS
   */
  @NotNull
  List<String> allowedMethods;

  /**
   *  MaxAge config for CORS
   */
  @NotNull
  Long maxAge;

  /**
   *  Allow Credentials config for CORS
   */
  Boolean allowCredentials;

  /**
   *  Allowed Methods for CORS
   */
  List<String> exposeHeaders;
}
