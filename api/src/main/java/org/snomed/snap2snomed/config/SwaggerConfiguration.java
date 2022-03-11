package org.snomed.snap2snomed.config;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

/**
 *  Configuration properties for swagger ui
 */
@Getter
@Setter
public class SwaggerConfiguration {

    @NotNull
    String applicationName;

    @NotNull
    String applicationDescription;

    @NotNull
    String applicationVersion;

    @NotNull
    String termsOfService;

    // 
    @NotNull
    String licenseName;

    @NotNull
    String licenseUrl;

    @NotNull
    String contactName;

    @NotNull
    @Email(message = "Swagger UI Contact email should be valid")
    String contactEmail;

    @NotNull
    String contactUrl;
}
