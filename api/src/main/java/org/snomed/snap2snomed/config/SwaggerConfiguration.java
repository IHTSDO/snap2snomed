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

package org.snomed.snap2snomed.config;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

/**
 *  Configuration properties for swagger ui
 */
@Getter
@Setter
public class SwaggerConfiguration {

    @NotNull
    String applicationName;

    @NotNull
    String applicationDescription;

    @NotNull
    String applicationVersion;

    @NotNull
    String termsOfService;

    // 
    @NotNull
    String licenseName;

    @NotNull
    String licenseUrl;

    @NotNull
    String contactName;

    @NotNull
    @Email(message = "Swagger UI Contact email should be valid")
    String contactEmail;

    @NotNull
    String contactUrl;
}
