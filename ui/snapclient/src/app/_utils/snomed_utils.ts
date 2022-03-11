
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

export class SnomedUtils {

  static parserVersionUri(version: string) {
    const matches = version.match('^http://snomed.info/(?<experimental>x?)sct/(?<edition>[0-9]{6,18})/version/(?<effectiveTime>[0-9]{8})');

    return {
      experimental: matches?.groups?.experimental ? true : false,
      edition: matches?.groups?.edition ?? null,
      effectiveTime: matches?.groups?.effectiveTime,
    };
  }

  static toCountry(edition: string) {
    return this.countries[edition];
  }

  private static countries: { [key: string]: string|null } = {
    '32506021000036107': 'au',
    '11000172109': 'be',
    '999000031000000106': 'gb',
    '999000021000000109': 'gb',
    '83821000000107': 'gb',
    '900000000000207008': 'int',
    '731000124108': 'us',
    '449081005': 'es',
    '450829007': 'oth',
    '11000221109': 'ar',
    '11000146104': 'nl',
    '15561000146104': 'nl',
    '45991000052106': 'se',
    '20611000087101': 'ca',
    '21000210109': 'nz',
    '332351000009108': 'vet',
  };

}
