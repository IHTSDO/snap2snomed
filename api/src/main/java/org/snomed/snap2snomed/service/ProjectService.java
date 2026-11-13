package org.snomed.snap2snomed.service;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.ComparableExpressionBase;
import com.querydsl.jpa.impl.JPAQuery;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.snomed.snap2snomed.controller.dto.ProjectDto;
import org.snomed.snap2snomed.model.*;
import org.snomed.snap2snomed.repository.*;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ProjectService {

  public static class ProjectFilter {
    private final String text;
    private final String role;

    public ProjectFilter(String text, String role) {
      this.text = text;
      this.role = role;
    }
  }

  @Autowired private AuthenticationFacade authenticationFacade;
  @Autowired private EntityManager entityManager;
  @Autowired private MappingService mappingService;
  @Autowired private MapRepository mapRepository;
  @Autowired private ProjectRepository projectRepository;

  QProject project = QProject.project;

  /**
   * Delete a project and all its related entities.
   * First: Note, Tasks, MapRowTarget, MapRow
   * Then: Map
   * Then: Project
   * @param project the project to be deleted
   */
  @Transactional
  public void deleteProject(Project project) {
    List<Map> maps = project.getMaps();
    maps.forEach(map -> mappingService.deleteMapRelatedEntities(map.getId()));
    List<Long> mapIds = maps.stream().map(Map::getId).collect(Collectors.toList());
    mapRepository.deleteAllById(mapIds);
    projectRepository.delete(project);
  }

  public PagedModel<EntityModel<ProjectDto>> getFilteredProjects(Pageable pageable,
                                                              PagedResourcesAssembler<ProjectDto> assembler,
                                                              ProjectFilter filter) {

    JPAQuery<ProjectDto> query = new JPAQuery<ProjectDto>(entityManager)
        .select(Projections.constructor(ProjectDto.class, project))
        .from(project);
    addWhereClause(query, filter);
    query.offset(pageable.getOffset()).limit(pageable.getPageSize());

    for (Sort.Order order : pageable.getSort()) {
      ComparableExpressionBase<?> field;
      switch (order.getProperty()) {
        case "modified":
          field = project.modified;
          break;
        case "title":
          field = project.title;
          break;
        default:
          field = project.created;
      }

      if (field != null) {
        if (order.isAscending()) {
          query = query.orderBy(field.asc());
        } else {
          query = query.orderBy(field.desc());
        }
      }
    }

    List<ProjectDto> results = query.fetch();
    Page<ProjectDto> page = new PageImpl<>(results, pageable, query.fetchCount());
    return assembler.toModel(page);
  }

  public Project getProject(Long projectId) {
    Project project = null;
    Optional<Project> optional = projectRepository.findById(projectId);
    if (optional.isPresent()) {
      project = optional.get();
    }

    return project;
  }

  private void addWhereClause(JPAQuery<ProjectDto> query, ProjectFilter filter) {
    User currentUser = authenticationFacade.getAuthenticatedUser();
    boolean isAdminUser = authenticationFacade.isAdminUser(); // if admin, show all when role = all

    BooleanExpression whereClause = null;
    List<BooleanExpression> clauses = new ArrayList<>();

    if (StringUtils.isNotBlank(filter.role)) {
      switch (filter.role) {
        case "owner":
          whereClause = project.owners.contains(currentUser);
          break;
        case "member":
          whereClause = project.members.contains(currentUser);
          break;
        case "guest":
          whereClause = project.guests.contains(currentUser);
          break;
        case "all":
          if (!isAdminUser) {
            whereClause = project.owners.contains(currentUser).or(project.members.contains(currentUser))
                                        .or(project.guests.contains(currentUser));
          }
          break;
      }
    }

    if (StringUtils.isNotBlank(filter.text)) {
      BooleanExpression whereText = project.title.containsIgnoreCase(filter.text)
                                                 .or(project.description.containsIgnoreCase(filter.text));
      if (whereClause == null) {
        whereClause = whereText;
      } else {
        whereClause = whereClause.and(whereText);
      }
    }

    if (whereClause != null) {
      query.where(whereClause);
    }
  }
}
