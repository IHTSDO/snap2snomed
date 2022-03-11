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
