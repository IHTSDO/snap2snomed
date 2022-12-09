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

drop table if exists imported_code_additional_columns cascade;
create table imported_code_additional_columns (imported_code_id bigint not null, value varchar(255), collection_order integer not null);
create table imported_codeset_additional_columns (imported_codeset_id bigint not null, name varchar(255), type varchar(255), collection_order integer not null);

alter table imported_code_additional_columns add constraint FK5vpm8qo68l2bkocmeoufnfiqx foreign key (imported_code_id) references imported_code (id);
alter table imported_codeset_additional_columns add constraint FK5vpm8qo68l2bkocmeoufnfiqy foreign key (imported_codeset_id) references imported_codeset (id);

create table imported_code_additional_columns_aud (imported_code_id bigint not null, rev integer not null, revtype tinyint, value varchar(255), collection_order integer not null, primary key (imported_code_id, collection_order, rev));
create table imported_codeset_additional_columns_aud (imported_codeset_id bigint not null, rev integer not null, revtype tinyint, name varchar(255), type varchar(255), collection_order integer not null, primary key (imported_codeset_id, collection_order, rev));

alter table imported_code_additional_columns_aud add constraint FK89ntto9kobwahrwxbne2nqcnx foreign key (rev) references revinfo (rev);
alter table imported_codeset_additional_columns_aud add constraint FK89ntto9kobwahrwxbne2nqcny foreign key (rev) references revinfo (rev);
