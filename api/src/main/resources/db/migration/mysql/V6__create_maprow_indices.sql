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

IF (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME='map_row' AND INDEX_NAME='author_task_id_idx') != 1 THEN
    ALTER TABLE map_row ADD INDEX author_task_idx (author_task_id);
END IF;

IF (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME='map_row' AND INDEX_NAME='review_task_id_idx') != 1 THEN
    ALTER TABLE map_row ADD INDEX review_task_idx (review_task_id);
END IF;