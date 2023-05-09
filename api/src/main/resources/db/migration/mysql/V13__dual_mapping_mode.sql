/*
 * Copyright © 2023 SNOMED International
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

ALTER TABLE project ADD dual_map_mode BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_aud ADD dual_map_mode BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE map_row DROP FOREIGN KEY FK93uu5g46v77a1uah6ck1enwwl;
ALTER TABLE map_row DROP CONSTRAINT UniqueMapAndSourceCode;
ALTER TABLE map_row ADD CONSTRAINT FK93uu5g46v77a1uah6ck1enwwl FOREIGN KEY (map_id) REFERENCES map (id);

ALTER TABLE map_row ADD master_map_row_id BIGINT;
ALTER TABLE map_row ADD CONSTRAINT UniqueIdAndMasterMapRowId UNIQUE (id, master_map_row_id);
ALTER TABLE map_row_aud ADD master_map_row_id BIGINT;
ALTER TABLE map_row ADD child_map_row_id BIGINT;
ALTER TABLE map_row ADD CONSTRAINT UniqueIdAndChildMapRowId UNIQUE (id, child_map_row_id);
ALTER TABLE map_row_aud ADD child_map_row_id BIGINT;

ALTER TABLE map_row ADD blind_map_flag BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE map_row_aud ADD blind_map_flag BOOLEAN NOT NULL DEFAULT FALSE;