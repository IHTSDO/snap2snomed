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

package org.snomed.snap2snomed.controller.dto;

import java.util.Collection;
import java.util.List;

import org.snomed.snap2snomed.model.AdditionalCodeColumn;
import org.springframework.hateoas.Links;
import org.springframework.hateoas.PagedModel;
import org.springframework.hateoas.PagedModel.PageMetadata;

import lombok.Data;

@Data
public class Snap2SnomedPagedModel<T> {

  private List<MappedRowDetailsDto> sourceDetails;
  private Links links;
  private Collection<T> content;
  private PageMetadata page;
  private List<AdditionalCodeColumn> additionalColumns;

  public Snap2SnomedPagedModel(PagedModel<T> pagedModel, List<MappedRowDetailsDto> sourceDetails, List<AdditionalCodeColumn> additionalColumns) {
    this.page = pagedModel.getMetadata();
    this.content = pagedModel.getContent();
    this.links = pagedModel.getLinks();
    this.sourceDetails = sourceDetails;
    this.additionalColumns = additionalColumns;
  }
}