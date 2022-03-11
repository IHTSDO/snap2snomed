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

package org.snomed.snap2snomed.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.problem.auth.InvalidIdentitiyTokenProblem;
import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.repository.UserRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.security.WebSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.hateoas.server.ExposesResourceFor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.Size;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

// this requires an authenticated user to ensure they have a valid access token, but doesn't
// require a "valid" user in the database - this is how users get into the database
@Validated
@RestController
public class UserRestController {

  @Autowired
  private UserRepository repository;

  @Autowired
  @Qualifier("idTokenDecoder")
  private JwtDecoder idTokenDecoder;

  @Autowired
  AuthenticationFacade authenticationFacade;

  @Autowired
  Snap2snomedConfiguration config;

  @Autowired
  WebSecurity webSecurity;  

  @Operation
  @PutMapping(value = "/users/token/{id}", consumes = "application/jwt")
  ResponseEntity<User> createUserFromIdToken(@PathVariable(required = true) @Size(max = 255) String id,
      @AuthenticationPrincipal Jwt principal, @RequestBody String idToken) {

    Jwt token;
    try {
      token = idTokenDecoder.decode(idToken);
    } catch (Exception e) {
      throw new InvalidIdentitiyTokenProblem(e);
    }

    String principalSubject = principal.getClaimAsString(JwtClaimNames.SUB);
    String subject = token.getClaimAsString(JwtClaimNames.SUB);
    if (!principalSubject.equals(subject)) {
      throw new AccessDeniedException("Access token issued for '" + principalSubject + "'" + " but id token is for '" + subject + "'.");
    }

    if (!id.equals(subject)) {
      throw new AccessDeniedException("Specified user id " + id + " does not match the token subject " + subject + ".");
    }

    if (!Boolean.TRUE.equals(token.getClaimAsBoolean("email_verified"))) {
      throw new AccessDeniedException("User's email address is not verified by the identity provider");
    }

    HttpStatus returnStatus = HttpStatus.CREATED;

    User user = repository.findById(id).orElse(null);

    if (user == null) {
      user = User.builder().build();
    } else {
      returnStatus = HttpStatus.OK;
    }
    user.setId(subject);
    user.setGivenName(token.getClaimAsString("given_name"));
    user.setFamilyName(token.getClaimAsString("family_name"));
    user.setNickname(token.getClaimAsString("nickname"));
    user.setEmail(token.getClaimAsString("email"));

    User savedUser = repository.save(user);
    return new ResponseEntity<>(savedUser, returnStatus);
  }

  @Operation
  @PostMapping(value = "/users/acceptTerms")
  void acceptTerms() {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    } 
    User user = authenticationFacade.getAuthenticatedUser();
    user.setAcceptedTermsVersion(config.getCurrentTermsVersion());
    repository.save(user);
  }

}
