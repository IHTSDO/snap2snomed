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

import {Pipe, PipeTransform} from '@angular/core';

const min = 1000 * 60;

@Pipe({name: 'lastupdated'})
export class LastupdatedPipe implements PipeTransform {
  transform(datefield?: Date | null): string | null {
    if (!datefield) {
      return datefield ?? null;
    }
    const today = new Date();
    const diff = Math.floor(today.getTime() - new Date(datefield).getTime());
    const mins = Math.floor(diff / min);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 31);
    const years = Math.floor(days / 365.25);

    let interval = [];
    if (days == 0) {
      if (hours > 0) {
        interval.push(hours%24 + ' hours');
      }
      if (mins > 0) {
        interval.push(mins%60 + ' minutes');
      }
    } else if (years == 0) {
      interval.push(days%31 + ' days');
    }
    if (months > 0) {
      interval.push(months%12 + ' months');
    }
    if (years > 0) {
      interval.push(years + ' years');
    }
    interval = interval.slice(-2);
    if (interval.length) {
      return interval.join(', ') + ' ago';
    } else {
      return 'just now'
    }

  }
}
