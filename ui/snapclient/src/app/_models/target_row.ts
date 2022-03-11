/** Target for source - many to one.
 * Note: Named as TargetRow as Target has conflicts in JS
 */
import {SourceCode} from './source_code';
import {Mapping} from './mapping';
import {MapRow} from './map_row';

export class TargetRow {
  row?: string;
  id?: string;
  targetCode?: string;
  targetDisplay?: string;
  relationship?: string;
  flagged?: boolean;

  constructor(row: string | undefined, id: string | undefined, targetCode: string | undefined, targetDisplay: string | undefined,
              relationship: string | undefined, flagged: boolean | undefined) {
    this.row = row;
    this.id = id;
    this.targetCode = targetCode;
    this.targetDisplay = targetDisplay;
    this.relationship = relationship;
    this.flagged = flagged;
  }

  static replacer(key: string, value: any): any {
    if (value !== null && key === 'row') {
      return '/mapRows/' + value.toString();
    }
    return value;
  }
}

export class JSONTargetRow extends TargetRow {
  source?: SourceCode;
  mapping?: Mapping;
  // @ts-ignore
  row?: MapRow;

  constructor(row: MapRow | undefined, id: string | undefined, targetCode: string | undefined, targetDisplay: string | undefined,
              relationship: string | undefined, flagged: boolean, source: SourceCode | undefined, mapping: Mapping | undefined) {
    super(row?.id || '', id, targetCode, targetDisplay, relationship, flagged);
    this.source = source;
    this.mapping = mapping;
    this.row = row;
  }
}
