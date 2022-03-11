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

package org.snomed.snap2snomed.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class JwtDecoderConfigurer {
  @Autowired
  private Snap2snomedConfiguration config;

  @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
  private String issuerUri;

  @Bean
  @Primary
  JwtDecoder jwtDecoder() {
    NimbusJwtDecoder jwtDecoder = (NimbusJwtDecoder) JwtDecoders.fromIssuerLocation(issuerUri);

    Collection<OAuth2TokenValidator<Jwt>> validators = new ArrayList<>();
    log.info("ids are " + config.getSecurity().getAudience() + " and " + config.getSecurity().getClientId());


    String audience = config.getSecurity().getAudience();

    if (audience != null && !audience.isBlank()) {
      validators.add(audienceValidator());
    }

    String clientId = config.getSecurity().getClientId();

    if (clientId != null && !clientId.isBlank()) {
      validators.add(clientIdValidator());
    }

    validators.add(JwtValidators.createDefaultWithIssuer(issuerUri));

    OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(validators);

    jwtDecoder.setJwtValidator(validator);

    return jwtDecoder;
  }

  @Bean
  JwtDecoder idTokenDecoder() {
    return JwtDecoders.fromIssuerLocation(issuerUri);
  }

  OAuth2TokenValidator<Jwt> audienceValidator() {
    return new JwtClaimValidator<List<String>>(JwtClaimNames.AUD, aud -> aud != null && aud.contains(config.getSecurity().getAudience()));
  }

  /*
   * This is for Cognito, which doesn't put the `aud` claim in access tokens
   */
  OAuth2TokenValidator<Jwt> clientIdValidator() {
    return new JwtClaimValidator<String>("client_id",
        clientId -> clientId != null && clientId.contains(config.getSecurity().getClientId()));
  }
}
