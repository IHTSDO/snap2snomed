package org.snomed.snap2snomed.service;

import ca.uhn.fhir.rest.annotation.Operation;
import ca.uhn.fhir.rest.annotation.OperationParam;
import ca.uhn.fhir.rest.client.api.IRestfulClient;
import org.hl7.fhir.r4.model.BooleanType;
import org.hl7.fhir.r4.model.IntegerType;
import org.hl7.fhir.r4.model.ValueSet;

public interface TerminologyClient extends IRestfulClient {
    @Operation(name = "$expand", type = ValueSet.class)
    ValueSet expand(@OperationParam(name = "valueSet") ValueSet valueSet,
                    @OperationParam(name = "count") IntegerType count,
                    @OperationParam(name = "offset") IntegerType offset,
                    @OperationParam(name = "activeOnly") BooleanType activeOnly
    );
}
