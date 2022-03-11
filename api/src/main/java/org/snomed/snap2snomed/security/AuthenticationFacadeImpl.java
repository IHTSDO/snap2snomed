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

import java.util.List;
import java.util.NoSuchElementException;

import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.auth.MissingJwtProblem;
import org.snomed.snap2snomed.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFacadeImpl implements AuthenticationFacade {

  @Autowired
  UserRepository userRepository;

  @Autowired
  Snap2snomedConfiguration configuration;

  @Override
  public Authentication getAuthentication() {
    return SecurityContextHolder.getContext().getAuthentication();
  }

  @Override
  public String getPrincipalSubject() {
    Authentication authentication = getAuthentication();
    if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
      return ((Jwt) authentication.getPrincipal()).getClaimAsString(JwtClaimNames.SUB);
    } else {
      throw new MissingJwtProblem();
    }
  }

  @Override
  public User getAuthenticatedUser() {
    String subject = getPrincipalSubject();
    return userRepository.findById(subject).orElseThrow(() -> new NoSuchElementException(
        "No such user " + subject + " (" + getPrincipalEmail() + ")"));
  }

  private String getPrincipalEmail() {
    Authentication authentication = getAuthentication();
    if (authentication.getPrincipal() instanceof Jwt) {
      return ((Jwt) authentication.getPrincipal()).getClaimAsString("email");
    } else {
      throw new MissingJwtProblem();
    }
  }

  public Boolean isAdminUser() {
    Authentication authentication = getAuthentication();
    if (authentication.getPrincipal() instanceof Jwt) {
      List<String> groups = ((Jwt) authentication.getPrincipal()).getClaimAsStringList("cognito:groups");
      return groups.contains(configuration.getSecurity().getAdminGroup());
    } else {
      throw new MissingJwtProblem();
    }
  }
}