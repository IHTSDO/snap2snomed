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

import ca.uhn.fhir.rest.server.exceptions.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.*;
import org.ihtsdo.snomed.util.SnomedUtils;
import org.ihtsdo.snomed.util.rf2.schema.RF2SchemaConstants;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.controller.dto.ValidationResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.codec.Utf8;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class FhirService {

    private static final String DEFAULT_CODE_SYSTEM = "http://snomed.info/sct";

    @Autowired
    TerminologyProvider terminologyProvider;

    @Autowired
    Snap2snomedConfiguration configuration;

    public ValidationResult validateValueSetComposition(
            Set<String> codes, String codeSystemVersion, String scope) throws IOException {
        Set<String> invalid = new HashSet<>();
        if (codes != null) {
            for (String code : codes) {
                if (code != null && !code.trim().isEmpty() && !isValidSctId(code, RF2SchemaConstants.PartionIdentifier.CONCEPT)) {
                    invalid.add(code);
                }
            }
            codes.removeAll(invalid);
        }
        if (codes == null || codes.isEmpty()) {
            return new ValidationResult(0, new HashSet<>(), new HashSet<>(), invalid);
        }
      ValueSet valueSetToExpand = new ValueSet();
      ValueSet.ConceptSetComponent conceptSetComponent = new ValueSet.ConceptSetComponent();
      conceptSetComponent.setSystem(DEFAULT_CODE_SYSTEM);
      conceptSetComponent.setVersion(codeSystemVersion);
      codes.stream().forEach(targetCode -> conceptSetComponent.addConcept(
              new ValueSet.ConceptReferenceComponent(new CodeType(targetCode))));
      String reqScope = scope;
      if (reqScope != null) {
        if (!reqScope.matches("^http.*")) {
            reqScope = codeSystemVersion + "?fhir_vs=ecl/" + reqScope;
        }
        reqScope = reqScope.replaceAll("\\|", URLEncoder.encode("|", Charset.defaultCharset()));
        conceptSetComponent.setValueSet(List.of(new CanonicalType(reqScope)));
        valueSetToExpand.getCompose().addInclude(conceptSetComponent);
      }
      int count = 0, offset = 0;
      TerminologyClient terminologyClient = terminologyProvider.getClient();
      ValueSet responseVs = new ValueSet();
      try {
          responseVs = terminologyClient.expand(valueSetToExpand, new IntegerType(count), new IntegerType(offset), new BooleanType(false));
      } catch (ResourceNotFoundException e) {
          responseVs.setExpansion(new ValueSet.ValueSetExpansionComponent());
      }
      ValueSet.ValueSetExpansionComponent expansion = responseVs.getExpansion();
      List<ValueSet.ValueSetExpansionContainsComponent> contains = new ArrayList<>();

      while (contains.size() < expansion.getTotal()) {
        offset = contains.size();
        count = configuration.getMaximumImportedCodeSetRows();
        if ((offset + count) > expansion.getTotal()) {
          count = expansion.getTotal() - offset;
        }
        responseVs = terminologyClient.expand(valueSetToExpand, new IntegerType(count), new IntegerType(offset), new BooleanType(false));
        expansion = responseVs.getExpansion();
        contains.addAll(expansion.getContains());
      }

      Set<String> inactive = contains.stream()
              .filter(ValueSet.ValueSetExpansionContainsComponent::getInactive)
              .map(ValueSet.ValueSetExpansionContainsComponent::getCode).collect(Collectors.toSet());
      Set<String> active = contains.stream()
              .filter(entry -> !entry.getInactive())
              .map(ValueSet.ValueSetExpansionContainsComponent::getCode).collect(Collectors.toSet());
      Set<String> absent = new HashSet<String>(codes);
      absent.removeAll(inactive);
      absent.removeAll(active);
      return new ValidationResult(active.size(), inactive, absent, invalid);
    }

    public static boolean isValidSctId(String code, RF2SchemaConstants.PartionIdentifier partition) {
        try {
            SnomedUtils.isValid(code, partition, true);
        } catch (Exception e) {
            return false;
        }
        return true;
    }
}
