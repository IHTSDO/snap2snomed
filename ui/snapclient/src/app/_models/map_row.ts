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

import {TargetRow} from './target_row';
import {SourceCode} from './source_code';
import {Mapping} from './mapping';
import {User} from './user';

export interface MapRow {
  id: string | null;
  map?: Mapping;
  noMap: boolean;
  sourceCode: SourceCode;
  status: string;
  created: Date;
  modified: Date;
  latestNote: Date | null;
}

/** Outer join of MapRow and MapRowTarget */
export class MapView {
  rowId: string;           // MapRow ID
  sourceIndex: string;
  sourceCode: string;
  sourceDisplay: string;
  assignedAuthor?: User | null;
  assignedReviewer?: User | null;
  lastAuthor?: User | null;
  lastReviewer?: User | null;

  targetId?: string;        // TargetRow ID
  targetCode?: string;
  targetDisplay?: string;
  relationship?: string;
  status: string;
  noMap: boolean;
  latestNote?: Date | null;
  flagged?: boolean;

  // Previous values
  private prevTargetCode?: string;
  private prevTargetDisplay?: string;
  private prevRelationship?: string;
  private prevStatus: string;
  private prevNoMap: boolean;
  private prevFlagged?: boolean;

  constructor(rowId: string, targetId: string | undefined, sourceIndex: string, sourceCode: string, sourceDisplay: string,
              targetCode: string | undefined, targetDisplay: string | undefined, relationship: string | undefined,
              status: string, noMap: boolean, latestNote: Date | null | undefined, assignedAuthor: User | null | undefined,
              assignedReviewer: User | null | undefined, lastAuthor: User | null | undefined,
              lastReviewer: User | null | undefined, flagged: boolean | undefined) {
    this.rowId = rowId;
    this.targetId = targetId;
    this.sourceIndex = sourceIndex;
    this.sourceCode = sourceCode;
    this.sourceDisplay = sourceDisplay;
    this.prevTargetCode = this.targetCode = targetCode;
    this.prevTargetDisplay = this.targetDisplay = targetDisplay;
    this.prevRelationship = this.relationship = relationship;
    this.prevStatus = this.status = status;
    this.prevNoMap = this.noMap = noMap;
    this.prevFlagged = this.flagged = flagged;
    this.latestNote = latestNote;
    this.assignedAuthor = assignedAuthor;
    this.assignedReviewer = assignedReviewer;
    this.lastAuthor = lastAuthor;
    this.lastReviewer = lastReviewer;
  }

  static create(mv: MapView): MapView {
    // Need to convert numbers to strings here; mv may (will) have been coerced to a MapView
    const rowId = mv.rowId === null ? '' : mv.rowId.toString();
    return new MapView(
      rowId, mv.targetId, mv.sourceIndex, mv.sourceCode, mv.sourceDisplay,
      mv.targetCode, mv.targetDisplay, mv.relationship, mv.status, mv.noMap, mv.latestNote,
      mv.assignedAuthor, mv.assignedReviewer, mv.lastAuthor, mv.lastReviewer, mv.flagged
    );
  }

  convertToMapRow(mapping: Mapping): MapRow {
    return {
      id: this.rowId, map: mapping, noMap: this.noMap,
      sourceCode: new SourceCode(this.sourceCode, this.sourceDisplay, mapping.source, this.sourceIndex),
      status: this.status, relationship: this.relationship, latestNote: this.latestNote
    } as unknown as MapRow;
  }

  updateStatus(status: string): void {
    this.prevStatus = this.status = status;
  }

  updateNoMap(noMap: boolean): void {
    this.prevNoMap = this.noMap = noMap;
  }

  updateFromRow(mapRow: MapRow): void {
    this.updateStatus(mapRow.status);
    this.updateNoMap(mapRow.noMap);
  }

  updateFromTarget(targetRow: TargetRow): void {
    this.targetId = targetRow.id;
    this.prevTargetCode = this.targetCode = targetRow.targetCode;
    this.prevTargetDisplay = this.targetDisplay = targetRow.targetDisplay;
    this.prevRelationship = this.relationship = targetRow.relationship;
    this.prevFlagged = this.flagged = targetRow.flagged;
  }

  reset(): void {
    this.targetCode = this.prevTargetCode;
    this.targetDisplay = this.prevTargetDisplay;
    this.relationship = this.prevRelationship;
    this.status = this.prevStatus;
    this.noMap = this.prevNoMap;
    this.flagged = this.prevFlagged;
  }

  hasTargetOrRelationshipChanged(): boolean {
    return this.prevTargetCode !== this.targetCode
      || this.prevTargetDisplay !== this.targetDisplay
      || this.prevRelationship !== this.relationship;
  }

  hasChanged(): boolean {
    return this.prevTargetCode !== this.targetCode
      || this.prevTargetDisplay !== this.targetDisplay
      || this.prevRelationship !== this.relationship
      || this.prevStatus !== this.status
      || this.prevNoMap !== this.noMap
      || this.prevFlagged !== this.flagged;
  }

  hasNoMapChanged(): boolean {
    return this.prevNoMap !== this.noMap;
  }
}

export class MapViewFilter {
  sourceCode = '';
  sourceDisplay = '';

  targetCode = '';
  targetDisplay = '';
  relationship: string[] | string = '';
  status: string[] | string = '';
  noMap?: boolean | undefined;
  lastAuthorReviewer: string[] | string = '';
  assignedAuthor: string[] | string = '';
  assignedReviewer: string[] | string = '';
  flagged?: boolean | undefined;

  hasFilters(): boolean {
    return this.sourceCode !== '' || this.sourceDisplay !== '' || this.targetCode !== '' || this.targetDisplay !== ''
      || this.relationship !== '' || this.status !== '' || this.noMap !== undefined || this.flagged !== undefined
      || this.lastAuthorReviewer !== '' || this.assignedAuthor !== '' || this.assignedReviewer !== '';
  }
}

export class MapViewPaging {
  pageIndex = 0;
  pageSize = 20;
  sortCol?: string;
  sortDirection?: string;
}

export class MappedRowDetailsDto {
  mapRowId = 0;
  mapRowTargetId: number | null | undefined;
  sourceIndex = 0;

  constructor(mapRowId: number, mapRowTargetId: number | null | undefined, sourceIndex: number) {
    this.mapRowId = mapRowId;
    this.mapRowTargetId = mapRowTargetId;
    this.sourceIndex = sourceIndex;
  }

}

export class Page {
  data: MapView[];
  pageIndex: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sourceDetails: MappedRowDetailsDto[];

  constructor(data: MapView[] = [], pageIndex: number = 0, size: number = 0, totalElements: number = 0, totalPages: number = 0, sourceIndexes: MappedRowDetailsDto[] = []) {
    this.data = data;
    this.pageIndex = pageIndex;
    this.size = size;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
    this.sourceDetails = sourceIndexes;
  }
}

/**
 * Dropdown lists
 */

export const enum MapRowRelationship {
  EQUIVALENT = 'TARGET_EQUIVALENT',
  BROADER = 'TARGET_BROADER',
  NARROWER = 'TARGET_NARROWER',
  INEXACT = 'TARGET_INEXACT',
}

export const enum MapRowStatus {
  UNMAPPED = 'UNMAPPED',
  DRAFT = 'DRAFT',
  MAPPED = 'MAPPED',
  INREVIEW = 'INREVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export function toMapRowStatus(statusString?: string): MapRowStatus | null {
  return statusString ? statusString as MapRowStatus : null;
}

export function mapRowStatusToIconName(status: MapRowStatus): string {
  switch (status) {
    case MapRowStatus.UNMAPPED:
      return 'radio_button_unchecked';
    case MapRowStatus.DRAFT:
      return 'pending';
    case MapRowStatus.MAPPED:
      return 'task_alt';
    case MapRowStatus.INREVIEW:
      return 'flaky';
    case MapRowStatus.ACCEPTED:
      return 'done_all';
    case MapRowStatus.REJECTED:
      return 'cancel';
    default:
      return 'circle';
  }
}

export const authorStatuses = [
  MapRowStatus.UNMAPPED,
  MapRowStatus.DRAFT,
  MapRowStatus.MAPPED
];

export const reviewStatuses = [
  MapRowStatus.INREVIEW,
  MapRowStatus.ACCEPTED,
  MapRowStatus.REJECTED
];

export const mapRowStatuses: MapRowStatus[] = authorStatuses.concat(reviewStatuses);

export const mapRowRelationships = [
  MapRowRelationship.EQUIVALENT,
  MapRowRelationship.BROADER,
  MapRowRelationship.NARROWER,
  MapRowRelationship.INEXACT];


