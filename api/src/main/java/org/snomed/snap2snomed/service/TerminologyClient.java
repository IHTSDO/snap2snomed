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
