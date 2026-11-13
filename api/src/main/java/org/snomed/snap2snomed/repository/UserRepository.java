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

package org.snomed.snap2snomed.repository;

import java.util.Optional;
import java.util.Set;
import org.snomed.snap2snomed.controller.UserRestController;
import org.snomed.snap2snomed.model.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.core.annotation.RestResource;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Use {@link UserRestController#createUserFromIdToken(String, Jwt, String)} to create
 */
@RepositoryRestResource
public interface UserRepository
    extends RevisionRepository<User, String, Integer>, PagingAndSortingRepository<User, String>, CrudRepository<User, String> {

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  // query is required to not leak project details to those outside the project
  @Query("select u from User u join Task t on t.assignee = u where t.map.project.id = :projectId"
      + " and (true = ?#{@authenticationFacadeImpl.isAdminUser()} "
      + "      or exists (select 1 from User u where u.id = ?#{@authenticationFacadeImpl.principalSubject} "
      + "                   and (u member of t.map.project.owners "
      + "                        or u member of t.map.project.members "
      + "                        or u member of t.map.project.guests)))")
  Set<User> findUsersAssignedToTasks(@Param("projectId") Long projectId);

  @Override
  Optional<User> findById(String s);

  // ---------------------------------
  // Exported in REST interface
  // ---------------------------------

  @Override
  @RestResource(exported = false)
  void deleteAll();

  @Override
  @RestResource(exported = false)
  void deleteAll(Iterable<? extends User> entities);

  @Override
  @RestResource(exported = false)
  Iterable<User> findAllById(Iterable<String> strings);

  @RestResource(exported = false)
  @Query("select case when (count(u) > 0) then true else false end from User u "
      + "join Project project on project.id = :projectId "
      + " and (u member of project.owners or u member of project.members or u member of project.guests)"
      + " and u.id = ?#{@authenticationFacadeImpl.principalSubject}")
  boolean isUserInProject(Long projectId);

  @RestResource(exported = false)
  @Query("select case when (count(u) > 0) then true else false end from User u "
      + "join Project project on u member of project.owners and u.id = ?#{@authenticationFacadeImpl.principalSubject} "
      + "join project.maps m "
      + "where m.id = :mapId")
  boolean isUserProjectOwnerForMapId(Long mapId);
}
