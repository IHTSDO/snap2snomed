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
