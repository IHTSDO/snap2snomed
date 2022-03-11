package org.snomed.snap2snomed.controller.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Value;
import org.hibernate.validator.constraints.URL;

@Value
@Builder
public class UserInterfaceConfigurationDetails {
  @NotBlank
  String appName;

  @NotBlank
  String authClientID;

  @NotBlank
  String authDomainUrl;

  @NotBlank
  String authLoginGrantType;

  @NotBlank
  String authLoginResponseType;

  @NotBlank
  String authLoginScope;

  @NotBlank
  String fhirBaseUrl;

  @NotNull
  Boolean production;

  @NotBlank
  String defaultLang;

  @NotNull
  Long maxFileSize;

  @NotNull
  String sentryDsn;

  @NotNull
  String sentryEnvironment;

  String sentryRelease;

  @NotNull
  Boolean sentryDialog;

  @NotBlank
  String adminGroup;

  @URL
  String userGuideUrl;

  @URL
  String termsOfServiceUrl;

  @URL
  String privacyPolicyUrl;

  @URL
  String userRegistrationUrl;

  String registrationText;

  @NotBlank
  String mainPageText;

  @NotBlank
  String currentTermsVersion;
}
