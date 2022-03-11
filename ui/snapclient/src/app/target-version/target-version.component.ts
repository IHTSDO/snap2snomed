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

import {Component, Input} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SnomedUtils} from '../_utils/snomed_utils';

@Component({
  selector: 'app-source-version',
  templateUrl: './target-version.component.html',
  styleUrls: ['./target-version.component.css']
})
export class TargetVersionComponent {
  @Input() system = 'http://snomed.info/sct';

  @Input() set version(v: string | null | undefined) {
    v = v ?? 'http://snomed.info/sct?fhir_vs';

    const {experimental, edition, effectiveTime} = SnomedUtils.parserVersionUri(v);

    this.country = (edition && SnomedUtils.toCountry(edition)) ?? null;

    if (experimental) {
      this.translate.get('EDITION.EXPERIMENTAL').subscribe(
        (text) => {
          this.experimental = text;
        }
      );
    } else {
      this.experimental = '';
    }
    this.translate.get('EDITION.' + edition).subscribe(
      (text) => {
        this.label = text;
      }
    );
    if (effectiveTime) {
      const year = +effectiveTime.slice(0, 4);
      const month = +effectiveTime.slice(4, 6) - 1;
      const day = +effectiveTime.slice(6, 8);
      if (effectiveTime.length === 16) {
        const hours = +effectiveTime.slice(9, 11);
        const mins = +effectiveTime.slice(11, 13);
        const secs = +effectiveTime.slice(13, 15);

        this.effectiveTime = new Intl.DateTimeFormat('UTC', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          timeZone: 'UTC',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(Date.UTC(year, month, day, hours, mins, secs));
      } else {
        this.effectiveTime = new Intl.DateTimeFormat('UTC', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          timeZone: 'UTC'
        }).format(Date.UTC(year, month, day));
      }
    }
  };

  label = 'Unknown SNOMED CT Edition';
  country: string | null = null;
  effectiveTime: Date | string = 'Latest available';
  experimental = '';

  constructor(private translate: TranslateService) {
  }

}
