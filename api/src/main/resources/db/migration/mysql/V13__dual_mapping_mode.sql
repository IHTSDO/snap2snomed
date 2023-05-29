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

ALTER TABLE map_row ADD blind_map_flag BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE map_row_aud ADD blind_map_flag BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE map_row ADD reconcile_task_id BIGINT;
ALTER TABLE map_row_aud ADD reconcile_task_id BIGINT;

ALTER TABLE map_row ADD INDEX reconcile_task_idx (reconcile_task_id);

/* 
   A union is created as a view as the full query cannot be represented by JPAQuery or BlazeJPAQuery.  

   JPAQuery does not support unions.

   BlazeJPAQuery claims to support union but it doesn't support the call of a constructor from the second select of a union 
   .. from the blaze manual .. "The SELECT clause can be used to specify projections that should be returned by a query. 
   Blaze Persistence completely aligns with JPQL regarding the support of the SELECT clause, except for constructor expressions."
   The workaround "selectNew" only works for CriteriaBuilder, not
   QueryDSL and then "selectNew" cannot be called within a union https://github.com/Blazebit/blaze-persistence/issues/565" 
*/
CREATE OR REPLACE VIEW map_view AS 
    SELECT id AS map_row_id, status, blind_map_flag, null as sibling_row_author_task_id
    FROM map_row 
    WHERE map_row.blind_map_flag = false
UNION
    SELECT mr1.id AS map_row_id, (CASE WHEN mr1.status != mr2.status THEN '1' ELSE mr1.status END), mr1.blind_map_flag,
    mr2.author_task_id
    FROM map_row mr1, map_row mr2
    WHERE mr1.source_code_id = mr2.source_code_id
    AND mr1.id < mr2.id
	AND mr1.blind_map_flag = true; 