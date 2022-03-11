#!/bin/sh -x

#
# Copyright © 2022 SNOMED International
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

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

