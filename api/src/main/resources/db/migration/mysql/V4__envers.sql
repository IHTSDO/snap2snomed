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

create table if not exists imported_codeset_aud
(
    id          bigint  not null,
    rev         integer not null,
    revtype     tinyint,
    created     timestamp null,
    created_by  varchar(255),
    modified    timestamp null,
    modified_by varchar(255),
    name        varchar(255),
    version     varchar(255),
    primary key (id, rev)
);
create table if not exists map_aud
(
    id          bigint  not null,
    rev         integer not null,
    revtype     tinyint,
    created     timestamp null,
    created_by  varchar(255),
    map_version varchar(255),
    modified    timestamp null,
    modified_by varchar(255),
    to_scope    varchar(255),
    to_version  varchar(255),
    project_id  bigint,
    source_id   bigint,
    primary key (id, rev)
);
create table if not exists map_row_aud
(
    id               bigint  not null,
    rev              integer not null,
    revtype          tinyint,
    created          timestamp null,
    created_by       varchar(255),
    modified         timestamp null,
    modified_by      varchar(255),
    no_map           boolean default false,
    status           integer,
    author_task_id   bigint,
    last_author_id   varchar(255),
    last_reviewer_id varchar(255),
    map_id           bigint,
    review_task_id   bigint,
    source_code_id   bigint,
    primary key (id, rev)
);
create table if not exists map_row_target_aud
(
    id             bigint  not null,
    rev            integer not null,
    revtype        tinyint,
    created        timestamp null,
    created_by     varchar(255),
    flagged        boolean,
    modified       timestamp null,
    modified_by    varchar(255),
    relationship   integer,
    target_code    varchar(255),
    target_display varchar(255),
    row_id         bigint,
    primary key (id, rev)
);
create table if not exists note_aud
(
    id          bigint  not null,
    rev         integer not null,
    revtype     tinyint,
    created     timestamp null,
    created_by  varchar(255),
    modified    timestamp null,
    modified_by varchar(255),
    note_text   varchar(255),
    maprow_id   bigint,
    note_by_id  varchar(255),
    primary key (id, rev)
);
create table if not exists project_aud
(
    id          bigint  not null,
    rev         integer not null,
    revtype     tinyint,
    created     timestamp null,
    created_by  varchar(255),
    description varchar(255),
    modified    timestamp null,
    modified_by varchar(255),
    title       varchar(255),
    primary key (id, rev)
);
create table if not exists project_guests_aud
(
    rev        integer      not null,
    project_id bigint       not null,
    guests_id  varchar(255) not null,
    revtype    tinyint,
    primary key (rev, project_id, guests_id)
);
create table if not exists project_members_aud
(
    rev        integer      not null,
    project_id bigint       not null,
    members_id varchar(255) not null,
    revtype    tinyint,
    primary key (rev, project_id, members_id)
);
create table if not exists project_owners_aud
(
    rev        integer      not null,
    project_id bigint       not null,
    owners_id  varchar(255) not null,
    revtype    tinyint,
    primary key (rev, project_id, owners_id)
);
create table if not exists task_aud
(
    id          bigint  not null,
    rev         integer not null,
    revtype     tinyint,
    created     timestamp null,
    created_by  varchar(255),
    description varchar(255),
    modified    timestamp null,
    modified_by varchar(255),
    type        integer,
    assignee_id varchar(255),
    map_id      bigint,
    primary key (id, rev)
);
create table if not exists user_aud
(
    id          varchar(255) not null,
    rev         integer      not null,
    revtype     tinyint,
    created     timestamp null,
    created_by  varchar(255),
    email       varchar(255),
    family_name varchar(255),
    given_name  varchar(255),
    modified    timestamp null,
    modified_by varchar(255),
    nickname    varchar(255),
    primary key (id, rev)
);
alter table imported_codeset_aud
    add constraint FKor5te4xivhobecfhum7tfr44t foreign key (rev) references revinfo (rev);
alter table map_aud
    add constraint FKhklbxq5ob1un7rtgy62g41hqu foreign key (rev) references revinfo (rev);
alter table map_row_aud
    add constraint FKcgl9ajracdgcy1y1se5f3wigl foreign key (rev) references revinfo (rev);
alter table map_row_target_aud
    add constraint FKsrdptu7mo9a5vktdbjel9421v foreign key (rev) references revinfo (rev);
alter table note_aud
    add constraint FKf4lnpja18lffbwr2fij7t2xrt foreign key (rev) references revinfo (rev);
alter table project_aud
    add constraint FKpnojd25gxjyn8jg0mj5k96mcl foreign key (rev) references revinfo (rev);
alter table project_guests_aud
    add constraint FKt2p1n1jrykm0b1h3xautklv55 foreign key (rev) references revinfo (rev);
alter table project_members_aud
    add constraint FKc9p9ut0twhogsql3m2t0jdxir foreign key (rev) references revinfo (rev);
alter table project_owners_aud
    add constraint FK6af8kc8w1ytoal4lfoa7144r9 foreign key (rev) references revinfo (rev);
alter table task_aud
    add constraint FKaerb34sjraiw4vjh4oh46rb71 foreign key (rev) references revinfo (rev);
alter table user_aud
    add constraint FK89ntto9kobwahrwxbne2nqcnr foreign key (rev) references revinfo (rev);