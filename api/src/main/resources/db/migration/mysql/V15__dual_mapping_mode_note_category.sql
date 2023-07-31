ALTER TABLE note
ADD COLUMN (category integer not null);

ALTER TABLE note_aud
ADD COLUMN (category integer);

