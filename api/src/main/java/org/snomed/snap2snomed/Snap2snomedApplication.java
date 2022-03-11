package org.snomed.snap2snomed;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.web.servlet.error.ErrorMvcAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.envers.repository.support.EnversRevisionRepositoryFactoryBean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

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

}
