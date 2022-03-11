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

package org.snomed.snap2snomed.service;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.client.api.IRestfulClientFactory;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TerminologyProvider {

    @Autowired
    Snap2snomedConfiguration configuration;

    private FhirContext fhirContext;
    private TerminologyClient client;

    public FhirContext getFhirContext() {
        if (this.fhirContext == null) {
            this.fhirContext = FhirContext.forR4();
        }
        return this.fhirContext;
    }

    public TerminologyClient getClient() {
        if (this.client == null) {
            IRestfulClientFactory restfulClientFactory = getFhirContext().getRestfulClientFactory();
            this.client = restfulClientFactory.newClient(TerminologyClient.class,
                    configuration.getDefaultTerminologyServer().getUrl());
        }
        return this.client;
    }
}
