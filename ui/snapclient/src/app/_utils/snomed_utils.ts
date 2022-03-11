
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
