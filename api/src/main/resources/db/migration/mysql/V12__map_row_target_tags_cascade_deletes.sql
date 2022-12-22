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

alter table map_row_target_tags drop constraint FKf8qe9o6u78cpkogwk5x0bsyui;
alter table map_row_target_tags add constraint FKf8qe9o6u78cpkogwk5x0bsyui foreign key (map_row_target_id) references map_row_target (id) on delete cascade;
