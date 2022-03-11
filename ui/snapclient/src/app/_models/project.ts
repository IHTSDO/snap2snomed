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

/**
 * Mapping metadata class
 */
import {Mapping} from './mapping';
import {User} from './user';

export class Project {
  id: string;
  title: string | null;
  description: string | null;
  created: Date;
  modified: Date;
  maps: Mapping[];
  mapcount: number | null;
  owners: User[];
  members: User[];
  guests: User[];

  constructor() {
    this.id = '';
    this.title = '';
    this.description = null;
    this.created = new Date();
    this.modified = new Date();
    this.maps = [];
    this.owners = [];
    this.members = [];
    this.guests = [];
    this.mapcount = 0;
  }

  static replacer(key: string, value: any): any {
    if (key === 'owners' || key === 'members' || key === 'guests') {
      return value.map((v: User) => '/users/' + v.id);
    }
    return value;
  }
}

export class ProjectPage {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;

  constructor() {
    this.number = 0;
    this.size = 0;
    this.totalElements = 0;
    this.totalPages = 0;
  }
}
