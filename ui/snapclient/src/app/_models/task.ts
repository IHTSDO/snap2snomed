import {Mapping} from './mapping';
import {User} from './user';

export const enum TaskType {
  AUTHOR = 'AUTHOR',
  REVIEW = 'REVIEW'
}

export const enum TaskConflictType {
  EXISTING = 'EXISTING',
  ROLE = 'ROLE',
  EXISTING_AND_ROLE = 'EXISTING_AND_ROLE'
}

export class Task {
  id: string;
  type: TaskType | string;
  description?: string;
  mapping: Mapping;
  assignee: User;
  sourceRowSpecification: string;
  sourceRowCount?: number;
  created?: Date | null;
  modified?: Date | null;
  reassignAlreadyAssignedRows: boolean;
  allowAssigneeToBeAuthorAndReviewer: boolean;

  static replacer(key: string, value: any): any {
    if (value !== null && key === 'assignee') {
      return '/users/' + value.id;
    } else if (value !== null && key === 'mapping') {
      return '/maps/' + value.id;
    }
    return value;
  }


  constructor(id: string, type: TaskType | string, description: string | undefined,
              mapping: Mapping, assignee: User, sourceRowSpecification: string, sourceRowCount: number,
              createdString: string | undefined, modifiedString: string | undefined,
              reassignAlreadyAssignedRows: boolean,
              allowAssigneeToBeAuthorAndReviewer: boolean) {
    this.id = id;
    this.type = type;
    this.description = description;
    this.mapping = mapping;
    this.assignee = assignee;
    this.sourceRowSpecification = sourceRowSpecification;
    this.sourceRowCount = sourceRowCount;
    if (createdString) {
      this.created = createdString.length > 0 ? new Date(createdString) : null;
    }
    if (modifiedString) {
      this.modified = modifiedString.length > 0 ? new Date(modifiedString) : null;
    }
    this.reassignAlreadyAssignedRows = reassignAlreadyAssignedRows;
    this.allowAssigneeToBeAuthorAndReviewer = allowAssigneeToBeAuthorAndReviewer;
  }

  public isAuthor(): boolean {
    return this.type === TaskType.AUTHOR;
  }

  public isReview(): boolean {
    return this.type === TaskType.REVIEW;
  }
}

export class IndexSpecification {
  count: number;
  specification: string;

  constructor(count: number, specification: string) {
    this.count = count;
    this.specification = specification;
  }
}
