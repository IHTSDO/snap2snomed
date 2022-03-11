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
