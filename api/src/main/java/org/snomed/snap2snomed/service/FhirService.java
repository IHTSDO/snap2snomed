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

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.hl7.fhir.r4.model.BooleanType;
import org.hl7.fhir.r4.model.CanonicalType;
import org.hl7.fhir.r4.model.CodeType;
import org.hl7.fhir.r4.model.IntegerType;
import org.hl7.fhir.r4.model.ValueSet;
import org.ihtsdo.snomed.util.SnomedUtils;
import org.ihtsdo.snomed.util.rf2.schema.RF2SchemaConstants;
import org.snomed.snap2snomed.config.Snap2snomedConfiguration;
import org.snomed.snap2snomed.controller.dto.ValidationResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.google.common.collect.Lists;

import ca.uhn.fhir.rest.server.exceptions.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class FhirService {

    public static final String DEFAULT_CODE_SYSTEM = "http://snomed.info/sct";

    @Autowired
    TerminologyProvider terminologyProvider;

    @Autowired
    Snap2snomedConfiguration configuration;

    public ValidationResult validateValueSetComposition(
            Set<String> codes, String codeSystemVersion, String scope) throws IOException {
        final Set<String> invalid = new HashSet<>();
        if (codes != null) {
            for (final String code : codes) {
                if (code != null && !code.trim().isEmpty() && !isValidSctId(code, RF2SchemaConstants.PartionIdentifier.CONCEPT)) {
                    invalid.add(code);
                }
            }
            codes.removeAll(invalid);
        }
        if (codes == null || codes.isEmpty()) {
            return new ValidationResult(0, new HashSet<>(), new HashSet<>(), invalid);
        }
      final ValueSet valueSetToExpand = new ValueSet();
      final List<ValueSet.ConceptSetComponent> conceptSetComponents = new ArrayList<>();
      final List<ValueSet.ConceptReferenceComponent> conceptReferenceComponents =
              codes.stream().map(targetCode -> new ValueSet.ConceptReferenceComponent(new CodeType(targetCode))).collect(Collectors.toList());
      final List<List<ValueSet.ConceptReferenceComponent>> partitionedConceptReferenceComponents =
              Lists.partition(conceptReferenceComponents, configuration.getDefaultTerminologyServer().getExpandBatchSize().intValue());
      String reqScope = scope;
      if (reqScope != null) {
        if (!reqScope.matches("^http.*")) {
            reqScope = codeSystemVersion + "?fhir_vs=ecl/" + reqScope;
        }
        reqScope = reqScope.replaceAll("\\|", URLEncoder.encode("|", Charset.defaultCharset()));
        final String finalReqScope = reqScope;
        partitionedConceptReferenceComponents.forEach(batch -> {
          final ValueSet.ConceptSetComponent batchedConceptSetComponent = new ValueSet.ConceptSetComponent();
          batchedConceptSetComponent.setSystem(DEFAULT_CODE_SYSTEM);
          batchedConceptSetComponent.setVersion(codeSystemVersion);
          batchedConceptSetComponent.setValueSet(List.of(new CanonicalType(finalReqScope)));
          batch.forEach(batchedConceptSetComponent::addConcept);
          conceptSetComponents.add(batchedConceptSetComponent);
        });
        valueSetToExpand.getCompose().setInclude(conceptSetComponents);
      }
      int count = 0, offset = 0;
      final TerminologyClient terminologyClient = terminologyProvider.getClient();
      ValueSet responseVs = new ValueSet();
      try {
          responseVs = terminologyClient.expand(valueSetToExpand, new IntegerType(count), new IntegerType(offset), new BooleanType(false));
      } catch (final ResourceNotFoundException e) {
          responseVs.setExpansion(new ValueSet.ValueSetExpansionComponent());
      }
      final ValueSet.ValueSetExpansionComponent expansion = responseVs.getExpansion();
      final List<ValueSet.ValueSetExpansionContainsComponent> contains = new ArrayList<>();

      while (contains.size() < expansion.getTotal()) {
        offset = contains.size();
        count = configuration.getMaximumImportedCodeSetRows();
        if ((offset + count) > expansion.getTotal()) {
          count = expansion.getTotal() - offset;
        }
        final List<ValueSet> responseVss = new ArrayList<>();
        final int finalCount = count;
        final int finalOffset = offset;
        conceptSetComponents.forEach(component -> {
          valueSetToExpand.getCompose().setInclude(List.of(component));
          responseVss.add(terminologyClient.expand(valueSetToExpand, new IntegerType(finalCount), new IntegerType(finalOffset),
                  new BooleanType(false)));
        });
        responseVss.forEach(item -> contains.addAll(item.getExpansion().getContains()));
      }

      final Set<String> inactive = contains.stream()
              .filter(ValueSet.ValueSetExpansionContainsComponent::getInactive)
              .map(ValueSet.ValueSetExpansionContainsComponent::getCode).collect(Collectors.toSet());
      final Set<String> active = contains.stream()
              .filter(entry -> !entry.getInactive())
              .map(ValueSet.ValueSetExpansionContainsComponent::getCode).collect(Collectors.toSet());
      final Set<String> absent = new HashSet<String>(codes);
      absent.removeAll(inactive);
      absent.removeAll(active);
      return new ValidationResult(active.size(), inactive, absent, invalid);
    }

    public static boolean isValidSctId(String code, RF2SchemaConstants.PartionIdentifier partition) {
        try {
            SnomedUtils.isValid(code, partition, true);
        } catch (final Exception e) {
            return false;
        }
        return true;
    }
}
