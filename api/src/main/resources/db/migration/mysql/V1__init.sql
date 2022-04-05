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

create table if not exists imported_code (id bigint not null auto_increment, code varchar(50), display varchar(512), _index bigint not null, imported_codeset_id bigint not null, primary key (id)) engine=InnoDB;
create table if not exists imported_codeset (id bigint not null auto_increment, created datetime(6), created_by varchar(255), modified datetime(6), modified_by varchar(255), name varchar(100), version varchar(30), primary key (id)) engine=InnoDB;
create table if not exists map (id bigint not null auto_increment, created datetime(6), created_by varchar(255), modified datetime(6), modified_by varchar(255), map_version varchar(30), to_scope varchar(1024) not null, to_version varchar(60), project_id bigint not null, source_id bigint not null, primary key (id)) engine=InnoDB;
create table if not exists map_row (id bigint not null auto_increment, created datetime(6), created_by varchar(255), modified datetime(6), modified_by varchar(255), no_map bit not null, status integer not null, author_task_id bigint, `last_author_id` varchar(255), `last_reviewer_id` varchar(255), map_id bigint not null, review_task_id bigint, source_code_id bigint not null, primary key (id)) engine=InnoDB;
create table if not exists map_row_target (id bigint not null auto_increment, created datetime(6), created_by varchar(255), modified datetime(6), modified_by varchar(255), flagged bit not null, relationship integer not null, target_code varchar(18), target_display varchar(2048), row_id bigint not null, primary key (id)) engine=InnoDB;
create table if not exists note (id bigint not null auto_increment, created datetime(6), created_by varchar(255), modified datetime(6), modified_by varchar(255), note_text varchar(256) not null, maprow_id bigint not null, `note_by_id` varchar(255) not null, primary key (id)) engine=InnoDB;
create table if not exists project (id bigint not null auto_increment, created datetime(6), created_by varchar(255), modified datetime(6), modified_by varchar(255), description varchar(200), title varchar(100), primary key (id)) engine=InnoDB;
create table if not exists project_guests (project_id bigint not null, guests_id varchar(255) not null, primary key (project_id, guests_id)) engine=InnoDB;
create table if not exists project_members (project_id bigint not null, members_id varchar(255) not null, primary key (project_id, members_id)) engine=InnoDB;
create table if not exists project_owners (project_id bigint not null, owners_id varchar(255) not null, primary key (project_id, owners_id)) engine=InnoDB;
create table if not exists task (id bigint not null auto_increment, created datetime(6), created_by varchar(255), modified datetime(6), modified_by varchar(255), description varchar(60), type integer not null, `assignee_id` varchar(255), map_id bigint not null, primary key (id)) engine=InnoDB;
create table if not exists `user` (id varchar(255) not null, created datetime(6), created_by varchar(255), modified datetime(6), modified_by varchar(255), email varchar(255), family_name varchar(100), given_name varchar(100), nickname varchar(100), primary key (id)) engine=InnoDB;
alter table imported_code add constraint UK2kj7s8wg0qgrisyvkf6rtdpf3 unique (_index, imported_codeset_id);
alter table imported_code add constraint UK2rnm9qqto6h88nqeoas3so3g unique (code, imported_codeset_id);
alter table map_row add constraint UniqueMapAndSourceCode unique (map_id, source_code_id);
alter table imported_code add constraint FKbmqbof5iexq8mo6p6vw1uh5e7 foreign key (imported_codeset_id) references imported_codeset (id);
alter table map add constraint FK5a8ljc6xrj8w0xmlyr92mrw2t foreign key (project_id) references project (id);
alter table map add constraint FK9jdh2jk489y0b49o4k35ld4ch foreign key (source_id) references imported_codeset (id);
alter table map_row add constraint FK5sq41qusaerjw4l4gm9tudrkq foreign key (author_task_id) references task (id);
alter table map_row add constraint FKsufg1nb3gqe6k06sarrwdjiht foreign key (`last_author_id`) references `user` (id);
alter table map_row add constraint FKas95ff8edlb36ql1ko1rertgp foreign key (`last_reviewer_id`) references `user` (id);
alter table map_row add constraint FK93uu5g46v77a1uah6ck1enwwl foreign key (map_id) references map (id);
alter table map_row add constraint FKs7lcvu6u8r0w2hap6ve299iag foreign key (review_task_id) references task (id);
alter table map_row add constraint FK9hqcobqlpiqo60q1mg1ywhgra foreign key (source_code_id) references imported_code (id);
alter table map_row_target add constraint FK97xhy765d746ecdgtgy7ccki4 foreign key (row_id) references map_row (id);
alter table note add constraint FK4c6i16l2wjnbd4wf7cea5jh2u foreign key (maprow_id) references map_row (id);
alter table note add constraint FKs7yw5sgwd20bsdl2shhq21u1d foreign key (`note_by_id`) references `user` (id);
alter table project_guests add constraint FK72xypqt6fthn93fr2grn2ncre foreign key (guests_id) references `user` (id);
alter table project_guests add constraint FK7bemis13nkyirufjjuw017pfh foreign key (project_id) references project (id);
alter table project_members add constraint FKsgthbwe2h7rtyme5msv3rvyi6 foreign key (members_id) references `user` (id);
alter table project_members add constraint FKi28gx2d4xrrhtrfnk12aef1e4 foreign key (project_id) references project (id);
alter table project_owners add constraint FK9nbt24endqpu1ximibb1mcwag foreign key (owners_id) references `user` (id);
alter table project_owners add constraint FKexkqjlfmh77jqhim0i33su5pl foreign key (project_id) references project (id);
alter table task add constraint FKlb5j5ow1845t8jxg555ums4th foreign key (`assignee_id`) references `user` (id);
alter table task add constraint FKd6jex3bd7gmx27d5efexbyf8m foreign key (map_id) references map (id);
