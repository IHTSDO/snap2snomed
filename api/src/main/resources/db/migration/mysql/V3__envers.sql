create table if not exists revinfo
(
    rev      integer not null auto_increment,
    revtstmp bigint,
    primary key (rev)
);