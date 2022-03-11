package org.snomed.snap2snomed.security;

import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.data.repository.query.SecurityEvaluationContextExtension;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class WebSecurityConfigurer extends WebSecurityConfigurerAdapter {

  @Autowired
  Snap2snomedConfiguration appConfig;

  @Autowired
  WebSecurity webSecurity;

  @Bean
  public SecurityEvaluationContextExtension securityEvaluationContextExtension() {
    return new SecurityEvaluationContextExtension();
  }

  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.cors().and().authorizeRequests()
        .antMatchers("/").permitAll()
        .antMatchers("/config").permitAll()
        .antMatchers("/actuator/**").permitAll()
        .antMatchers("/v3/api-docs/**").permitAll()
        .antMatchers("/swagger-ui/**").permitAll()
        .antMatchers("/swagger-ui.html").permitAll()
        .anyRequest().authenticated()
        .and()
        .addFilterAfter(new PreAuthFilter(webSecurity), BasicAuthenticationFilter.class)
        .oauth2ResourceServer()
        .jwt();
  }

  /**
   * CORS Configuration required for the frontend to communicate with the API
   * even if it's hosted on a different domain
   */
  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration corsConfig = new CorsConfiguration();
    corsConfig.setAllowedOriginPatterns(appConfig.getCors().getAllowedOriginPatterns());
    corsConfig.setAllowedMethods(appConfig.getCors().getAllowedMethods());
    corsConfig.setAllowedHeaders(appConfig.getCors().getAllowedHeaders());
    if (appConfig.getCors().getExposeHeaders() != null) {
      corsConfig.setExposedHeaders(appConfig.getCors().getExposeHeaders());
    }
    if (appConfig.getCors().getAllowCredentials() != null) {
      corsConfig.setAllowCredentials(appConfig.getCors().getAllowCredentials());
    }
    corsConfig.setAllowCredentials(true);
    corsConfig.setMaxAge(appConfig.getCors().getMaxAge());
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", corsConfig);
    return source;
  }

}
