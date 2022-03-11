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

// Main User class

export class User {
  id: string;
  givenName: string;
  familyName: string;
  email: string;
  token: TokenMsg | null;
  // JSON user fields
  created?: Date;
  modified?: Date;
  acceptedTermsVersion?: string;

  constructor() {
    this.id = '';
    this.givenName = '';
    this.familyName = '';
    this.email = '';
    this.token = null;
  }
}

export class ProjectUserFilter {
  username: string;
  email: string;
  project_role?: string = undefined;
  user?: User;

  constructor() {
    this.username = '';
    this.email = '';
  }

  setUserDetails(user: User): void {
    this.user = user;
    this.username = user.givenName + ' ' + user.familyName;
    this.email = user.email;
  }
}

export const enum ProjectRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
  NONE = 'NONE'
}

export const projectRoles = [
  ProjectRole.OWNER,
  ProjectRole.MEMBER,
  ProjectRole.GUEST,
  ProjectRole.NONE
]

// Tokens from Authentication Provider
export class TokenMsg {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;


  constructor(access_token: string, refresh_token: string, id_token: string, token_type: string, expires_in: number) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.id_token = id_token;
    this.token_type = token_type;
    this.expires_in = expires_in;
  }
}

// User info from Token via Authentication Provider
export class UserInfo {
  sub: string;
  given_name: string;
  family_name: string;
  email: string;

  constructor(sub: string, given_name: string, family_name: string, email: string) {
    this.sub = sub;
    this.given_name = given_name;
    this.family_name = family_name;
    this.email = email;
  }

}


