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
