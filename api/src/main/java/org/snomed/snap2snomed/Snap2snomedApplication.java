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

package org.snomed.snap2snomed;

import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.web.servlet.error.ErrorMvcAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.envers.repository.support.EnversRevisionRepositoryFactoryBean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.filter.CommonsRequestLoggingFilter;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;

@SpringBootApplication(exclude = ErrorMvcAutoConfiguration.class)
@EnableJpaRepositories(repositoryFactoryBeanClass = EnversRevisionRepositoryFactoryBean.class)
@ConfigurationPropertiesScan
public class Snap2snomedApplication {

  @Autowired
  Snap2snomedConfiguration configuration;

  public static void main(String[] args) {
    SpringApplication.run(Snap2snomedApplication.class, args);
  }

  /**
   * Swagger ui customisation
   */
  @Bean
  public OpenAPI customOpenAPI() {
      return new OpenAPI().components(new Components())
              .info(new Info().title(configuration.getSwagger().getApplicationName())
                      .description(configuration.getSwagger().getApplicationDescription())
                      .version(configuration.getSwagger().getApplicationVersion())
                      .termsOfService(configuration.getSwagger().getTermsOfService())
                      .contact(new Contact()
                        .name(configuration.getSwagger().getContactName())
                        .email(configuration.getSwagger().getContactEmail())
                        .url(configuration.getSwagger().getContactUrl()))
                      .license(new License()
                        .name(configuration.getSwagger().getLicenseName())
                        .url(configuration.getSwagger().getLicenseUrl())));
  }

  @Bean
  public CommonsRequestLoggingFilter logFilter() {
      final CommonsRequestLoggingFilter filter
        = new CommonsRequestLoggingFilter();
      filter.setIncludeQueryString(true);
      filter.setIncludePayload(true);
      filter.setMaxPayloadLength(10000);
      filter.setIncludeHeaders(false);
      filter.setAfterMessagePrefix("REQUEST DATA: ");
      return filter;
  }

}
