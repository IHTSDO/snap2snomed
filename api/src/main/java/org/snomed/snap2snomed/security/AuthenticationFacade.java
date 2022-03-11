package org.snomed.snap2snomed.security;

import org.snomed.snap2snomed.model.User;
import org.springframework.security.core.Authentication;

public interface AuthenticationFacade {

  Authentication getAuthentication();

  String getPrincipalSubject();

  User getAuthenticatedUser();

  Boolean isAdminUser();
}
