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

export class MappingImportSource {
  hasHeader: boolean | null;
  contentType: string;
  codeColumnIndex: number | null;
  displayColumnIndex: number | null;
  targetCodeColumnIndex: number | null;
  targetDisplayColumnIndex: number | null;
  relationshipColumnIndex: number | null;
  source_file?: File | null;
  delimiter?: string | null;
  mapId: string | null;

  constructor() {
    this.hasHeader = null;
    this.contentType = 'text/plain';
    this.codeColumnIndex = null;
    this.displayColumnIndex = null;
    this.targetCodeColumnIndex = null;
    this.targetDisplayColumnIndex = null;
    this.relationshipColumnIndex = null;
    this.source_file = null;
    this.delimiter = null;
    this.mapId = null;
  }
}
