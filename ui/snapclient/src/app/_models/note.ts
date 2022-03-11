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

import {User} from './user';
import {MapRow} from './map_row';


export class Note {
  id: number | null;
  noteText: string;
  noteBy: User;
  created: Date;
  modified: Date;
  mapRow: MapRow;

  constructor(id: number | null, noteText: string, noteBy: User, created: string, modified: string, mapRow: MapRow) {
    this.id = id;
    this.noteText = noteText;
    this.noteBy = noteBy;
    this.created = new Date(created);
    this.modified = new Date(modified);
    this.mapRow = mapRow;
  }

  static replacer(key: string, value: any): any {
    if (value !== null && key === 'mapRow') {
      return '/mapRows/' + value.id;
    } else if (value !== null && key === 'noteBy') {
      return '/users/' + value.id;
    }
    return value;
  }
}
