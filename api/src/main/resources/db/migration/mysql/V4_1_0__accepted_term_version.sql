alter table `user` add accepted_terms_version VARCHAR(255);
alter table `user_aud` add accepted_terms_version VARCHAR(255);
alter table map_row_target_aud modify target_display VARCHAR(2048);
