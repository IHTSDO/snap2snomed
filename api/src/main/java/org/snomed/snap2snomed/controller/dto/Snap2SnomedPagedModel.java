package org.snomed.snap2snomed.controller.dto;

import java.util.Collection;
import java.util.List;

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

  public Snap2SnomedPagedModel(PagedModel<T> pagedModel, List<MappedRowDetailsDto> sourceDetails) {
    this.page = pagedModel.getMetadata();
    this.content = pagedModel.getContent();
    this.links = pagedModel.getLinks();
    this.sourceDetails = sourceDetails;
  }
}