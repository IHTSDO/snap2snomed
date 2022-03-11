package org.snomed.snap2snomed.controller;

import io.swagger.v3.oas.annotations.Operation;
import javax.validation.Valid;
import org.snomed.snap2snomed.Snap2snomedVersion;
import org.snomed.snap2snomed.config.SecurityConfiguration;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.controller.dto.UserInterfaceConfigurationDetails;
import org.snomed.snap2snomed.controller.dto.UserInterfaceConfigurationDetails.UserInterfaceConfigurationDetailsBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.unit.DataSize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserInterfaceConfigurationRestController {
  @Autowired
  Snap2snomedConfiguration config;

  @Autowired
  Snap2snomedVersion version;

  @Value("${spring.servlet.multipart.max-file-size}")
  String maxFileSize;

  @Value("${sentry.dsn:}")
  String sentryDsn;

  @Value("${sentry.environment:LOCAL}")
  String sentryEnvironment;

  @Value("${sentry.dialog:false}")
  boolean sentryDialog;

  @Operation(description = "Returns configuration information for front end applications connecting to the server.")
  @GetMapping("/config")
  public @Valid UserInterfaceConfigurationDetails getConfiguration() {
    SecurityConfiguration security = config.getSecurity();

    UserInterfaceConfigurationDetailsBuilder builder = UserInterfaceConfigurationDetails.builder()
        .appName(config.getApplicationInstanceName())
        .authClientID(security.getClientId())
        .authDomainUrl(security.getAuthDomainUrl())
        .authLoginGrantType(security.getAuthLoginGrantType())
        .authLoginResponseType(security.getAuthLoginResponseType())
        .authLoginScope(security.getAuthLoginScope())
        .adminGroup(security.getAdminGroup())
        .fhirBaseUrl(config.getDefaultTerminologyServer().getUrl())
        .production(config.isProduction())
        .defaultLang(config.getDefaultLanguage())
        .maxFileSize(DataSize.parse(maxFileSize).toBytes())
        .sentryDsn(sentryDsn)
        .sentryEnvironment(sentryEnvironment)
        .sentryDialog(sentryDialog)
        .userGuideUrl(config.getUserGuideUrl())
        .termsOfServiceUrl(config.getTermsOfServiceUrl())
        .privacyPolicyUrl(config.getPrivacyPolicyUrl())
        .userRegistrationUrl(config.getUserRegistrationUrl())
        .registrationText(config.getRegistrationText())
        .mainPageText(config.getMainPageText())
        .currentTermsVersion(config.getCurrentTermsVersion());

    version.getShortGitCommit().ifPresent(builder::sentryRelease);

    return builder.build();
  }

}
