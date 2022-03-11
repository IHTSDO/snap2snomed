#!/bin/sh -x

# Generates the latest (H2) Schema snapshot so that diffs are simple to generate
# and thus create new Flyway migrations

SQL="src/test/resources/db/h2_schema_snapshot.sql"

rm ${SQL}

java \
      -Dspring.datasource.url="jdbc:h2:file:/tmp/db" \
      -Dspring.flyway.enabled="false" \
      -Dspring.jpa.properties.javax.persistence.schema-generation.create-source="metadata" \
      -Dspring.jpa.properties.javax.persistence.schema-generation.scripts.action="create" \
      -Dspring.jpa.properties.javax.persistence.schema-generation.scripts.create-target="${SQL}" \
      -Dspring.profiles.active=local \
  -jar target/api-0.1.0-SNAPSHOT.jar

