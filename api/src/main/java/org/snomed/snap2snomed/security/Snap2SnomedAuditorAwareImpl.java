package org.snomed.snap2snomed.security;

import java.util.Optional;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;

public class Snap2SnomedAuditorAwareImpl implements AuditorAware<String> {

  @Override
  public Optional<String> getCurrentAuditor() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    String principal = null;
    if (authentication.getPrincipal() instanceof Jwt) {
      principal = ((Jwt) authentication.getPrincipal()).getClaimAsString(JwtClaimNames.SUB);
    }

    return Optional.ofNullable(principal);
  }
}