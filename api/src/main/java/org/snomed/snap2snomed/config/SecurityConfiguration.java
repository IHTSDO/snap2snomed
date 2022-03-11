package org.snomed.snap2snomed.config;

import javax.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.snomed.snap2snomed.validation.AtLeastOneNotNull;

@Getter
@Setter
@AtLeastOneNotNull(fields = {"audience", "clientId"},
    message = "Either audience or clientId (for Cognito) must be set to validate tokens properly")
public class SecurityConfiguration {

  /**
   * aud value to verify in access tokens, if blank or null validation is skipped
   */
  String audience;

  /**
   * client_id value to verify in access tokens, if blank or null validation is skipped - this has
   * been included because AWS Cognito does not include aud in access tokens, but does include the
   * client_id
   */
  String clientId;

  @NotBlank
  String authDomainUrl;

  @NotBlank
  String authLoginGrantType = "authorization_code";

  @NotBlank
  String authLoginResponseType = "code";

  @NotBlank
  String authLoginScope = "email+openid+profile";

  @NotBlank
  String adminGroup = "AdminGroup";

}
