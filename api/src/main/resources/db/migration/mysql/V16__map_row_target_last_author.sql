alter table map_row_target add last_author_id varchar(255);

alter table map_row_target_aud add last_author_id varchar(255);

update map_row_target set last_author_id = modified_by;