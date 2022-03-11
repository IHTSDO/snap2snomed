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
