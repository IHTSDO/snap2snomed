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

package org.snomed.snap2snomed.repository.handler;

import com.google.common.collect.BoundType;
import com.google.common.collect.Range;
import com.google.common.collect.RangeSet;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import javax.persistence.EntityManager;
import org.snomed.snap2snomed.model.ImportedCode;
import org.snomed.snap2snomed.model.Map;
import org.snomed.snap2snomed.model.Project;
import org.snomed.snap2snomed.model.QMapRow;
import org.snomed.snap2snomed.model.QMapRowTarget;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.model.User;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.snomed.snap2snomed.problem.task.NoSuchAssigneeProblem;
import org.snomed.snap2snomed.problem.task.TaskAssigneeWithNoProjectRoleProblem;
import org.snomed.snap2snomed.problem.task.TaskDeletProblem;
import org.snomed.snap2snomed.problem.task.TaskSpecificationContainsUnassignableRowsProblem;
import org.snomed.snap2snomed.problem.task.UnauthorisedTaskAssignmentProblem;
import org.snomed.snap2snomed.repository.ImportedCodeRepository;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.snomed.snap2snomed.repository.ProjectRepository;
import org.snomed.snap2snomed.repository.TaskRepository;
import org.snomed.snap2snomed.repository.UserRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.util.SourceRowSpecificationUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkSave;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

@RepositoryEventHandler
public class TaskEventHandler {

  @Autowired
  ImportedCodeRepository importedCodeRepository;

  @Autowired
  MapRowRepository mapRowRepository;

  @Autowired
  ProjectRepository projectRepository;

  @Autowired
  UserRepository userRepository;

  @Autowired
  EntityManager entityManager;

  @Autowired
  AuthenticationFacade authenticationFacade;

  @Autowired
  TaskRepository taskRepository;

  private QMapRow mapRow = QMapRow.mapRow;
  private QMapRowTarget mapTarget = QMapRowTarget.mapRowTarget;

  @HandleBeforeCreate
  public void handleTaskBeforeCreate(Task task) {
    validateSaveAssignee(task);

    task.setSourceRowSpecification(SourceRowSpecificationUtils.normalise(
        task.getSourceRowSpecification(), getImportedCodeSetSize(task)));
  }

  @HandleAfterCreate
  public void handleTaskAfterCreate(Task task) {
    setMapRows(task);
  }

  @HandleBeforeSave
  public void handleTaskBeforeUpdate(Task task) {
    validateSaveAssignee(task);

    task.setSourceRowSpecification(SourceRowSpecificationUtils.normalise(
        task.getSourceRowSpecification(), getImportedCodeSetSize(task)));
  }

  @HandleAfterSave
  public void handleTaskAfterUpdate(Task task) {
    String principalSubject = authenticationFacade.getPrincipalSubject();
    Instant modified = Instant.now();
    if (task.getType().equals(TaskType.AUTHOR)) {
      mapRowRepository.setAuthorTaskToNull(task, modified, principalSubject);
    } else {
      mapRowRepository.setReviewTaskToNull(task, modified, principalSubject);
    }
    setMapRows(task);
  }

  @HandleBeforeDelete
  public void handleBeforeDelete(Task task) {
    String principalSubject = authenticationFacade.getPrincipalSubject();
    Instant modified = Instant.now();
    if (principalSubject == null || principalSubject.isBlank()) {
      throw Problem.valueOf(Status.UNAUTHORIZED, "No valid user is not logged in");
    }

    boolean isOwner = task.getMap().getProject().getOwners().stream().anyMatch(u -> u.getId().equals(principalSubject));
    boolean isAdmin = authenticationFacade.isAdminUser();

    if (!isOwner && !isAdmin) {
      throw new TaskDeletProblem("only-owners-can-delete", "Only owners are allowed to delete tasks", Status.FORBIDDEN);
    }

    if (task.getType().equals(TaskType.AUTHOR)) {
      mapRowRepository.setAuthorTaskToNull(task, modified, principalSubject);
    } else {
      mapRowRepository.setReviewTaskToNull(task, modified, principalSubject);
    }
  }

  @HandleBeforeLinkSave
  private void handleBeforeLinkSave(Task task, User assignee) {
    validateSaveAssignee(task);
  }

  /**
   * Validates that
   * <li>The task assignee has a project role - owner, member or guest</li>
   * <li>The user creating/modifying the task is an owner or member</li>
   * <li>If the user is a member then the assignee must be the user - only self assignment</li>
   * <li>If the user is a member or an owner not overriding assignment conditions, and the project has more than one user
   * <li>remove from author task specifications any rows where the assignee is also the assignee of a review task or the last reviewer</li>
   * <li>remove from review task specifications any rows where the assignee is also the assignee of an author task or the last author</li>
   * </li>
   *
   * @param task
   */
  private void validateSaveAssignee(Task task) {
    User assignee = task.getAssignee();
    Map map = task.getMap();
    if (map == null) {
      throw Problem.valueOf(Status.BAD_REQUEST,
          "Map associated with this task does not exist or the current user is not authorised for this project");
    }

    Project project = map.getProject();
    if (project == null) {
      throw Problem.valueOf(Status.BAD_REQUEST,
          "Project associated with this task does not exist or the current user is not authorised for this project");
    }

    Set<User> owners = project.getOwners();
    Set<User> members = project.getMembers();
    Set<User> guests = project.getGuests();
    if (assignee != null
        && !owners.contains(assignee)
        && (members == null || !members.contains(assignee))
        && (guests == null || !guests.contains(assignee))) {
      throw new TaskAssigneeWithNoProjectRoleProblem(assignee, project);
    }

    // if the user isn't the owner, check other assignee conditions
    String principalSubject = authenticationFacade.getPrincipalSubject();

    boolean isOwner = owners.stream().anyMatch(u -> u.getId().equals(principalSubject));
    boolean isMember = members != null && members.stream().anyMatch(u -> u.getId().equals(principalSubject));
    boolean isGuest = guests != null && guests.stream().anyMatch(u -> u.getId().equals(principalSubject));

    if (!isOwner && !isMember && !isGuest) {
      throw new UnauthorisedTaskAssignmentProblem(userRepository.findById(principalSubject).orElseThrow(), assignee,
          project, "The user has no role in this project.");
    } else if (isGuest) {
      throw new UnauthorisedTaskAssignmentProblem(userRepository.findById(principalSubject).orElseThrow(), assignee,
          project, "A guest cannot create or assign tasks, even to themselves.");
    } else if (isMember && !assignee.getId().equals(principalSubject)) {
      throw new UnauthorisedTaskAssignmentProblem(userRepository.findById(principalSubject).orElseThrow(), assignee,
          project, "A project member can only assign tasks to themselves.");
    } else if (isMember && ((task.getReassignAlreadyAssignedRows() != null && task.getReassignAlreadyAssignedRows())
        || (task.getAllowAssigneeToBeAuthorAndReviewer() != null && task.getAllowAssigneeToBeAuthorAndReviewer()))) {
      throw new UnauthorisedTaskAssignmentProblem(userRepository.findById(principalSubject).orElseThrow(), assignee,
          project, "A project member is not allowed to override task assignment and role conflict issues.");
    }

    if (task.getAssignee() == null) {
      throw new NoSuchAssigneeProblem();
    }

    String assigneeId = task.getAssignee().getId();

    // owners can do any of these guarded conditions, members are more restricted, guests can't do anything
    int numberOfUsersInProject = owners.size()
        + (members == null ? 0 : members.size())
        + (guests == null ? 0 : guests.size());
    if (numberOfUsersInProject > 1) {
      boolean allowAssigneeToBeAuthorAndReviewer =
          task.getAllowAssigneeToBeAuthorAndReviewer() == null ? false : task.getAllowAssigneeToBeAuthorAndReviewer();
      Set<Long> indexesWithRoleConflict = new HashSet<>();
      if (isMember || !allowAssigneeToBeAuthorAndReviewer) {
        if (task.getType().equals(TaskType.AUTHOR)) {
          // cannot have a review task for any of the rows
          // cannot have the author be the most recent reviwer
          indexesWithRoleConflict.addAll(
              findIndexesIncompatiblyAssigned(task,
                  mapRow.reviewTask.assignee.id.eq(assigneeId).or(mapRow.lastReviewer.id.eq(assigneeId))));
        } else if (task.getType().equals(TaskType.REVIEW)) {
          // cannot have an author task for any of the rows
          // cannot have been the most recent author for any of the rows
          indexesWithRoleConflict.addAll(
              findIndexesIncompatiblyAssigned(task,
                  mapRow.authorTask.assignee.id.eq(assigneeId).or(mapRow.lastAuthor.id.eq(assigneeId))));
        }
      }

      boolean reassignAlreadyAssignedRows =
          task.getReassignAlreadyAssignedRows() == null ? false : task.getReassignAlreadyAssignedRows();
      Set<Long> indexesWithExistingTask = new HashSet<>();
      if (isMember || !reassignAlreadyAssignedRows) {
        if (task.getType().equals(TaskType.AUTHOR)) {
          // cannot assign rows already assigned to an author task
          indexesWithExistingTask.addAll(
              findIndexesIncompatiblyAssigned(task, mapRow.authorTask.isNotNull()));
        } else if (task.getType().equals(TaskType.REVIEW)) {
          // cannot assign rows already assigned to a review task
          indexesWithExistingTask.addAll(
              findIndexesIncompatiblyAssigned(task, mapRow.reviewTask.isNotNull()));
        }
      }

      if (!indexesWithExistingTask.isEmpty() || !indexesWithRoleConflict.isEmpty()) {
        throw new TaskSpecificationContainsUnassignableRowsProblem(indexesWithExistingTask, indexesWithRoleConflict,
            task.getSourceRowSpecification(), getImportedCodeSetSize(task));
      }
    }
  }

  private List<Long> findIndexesIncompatiblyAssigned(Task task, BooleanExpression expression) {
    BooleanExpression whereClause = mapRow.map.id.eq(task.getMap().getId());
    // if this is an update to a task, the task can keep rows it already has
    if (task.getId() != null) {
      whereClause = whereClause
          .and(mapRow.authorTask.id.ne(task.getId()))
          .and(mapRow.reviewTask.id.ne(task.getId()));
    }
    whereClause = getSourceIndexWhereClause(task, whereClause).and(expression);

    return new JPAQuery<User>(entityManager)
        .select(mapRow.sourceCode.index).distinct()
        .from(mapRow)
        .leftJoin(mapRow.lastAuthor)
        .leftJoin(mapRow.lastReviewer)
        .leftJoin(mapRow.authorTask)
        .leftJoin(mapRow.reviewTask)
        .where(whereClause)
        .fetch();
  }

  private BooleanExpression getSourceIndexWhereClause(Task task, BooleanExpression whereClause) {
    RangeSet<Long> rangeSet = SourceRowSpecificationUtils.convertSourceRowSpecificationToRangeSet(task.getSourceRowSpecification());
    if (!rangeSet.encloses(Range.all())) {
      BooleanExpression expression = null;
      Collection<Long> inStatementIds = new ArrayList<>();
      for (Range<Long> range : rangeSet.asRanges()) {
        if (range.upperBoundType().equals(BoundType.CLOSED)) {
          expression = collectOrStatement(expression, mapRow.sourceCode.index.between(range.lowerEndpoint(), range.upperEndpoint()));
        } else if (range.lowerEndpoint() == range.upperEndpoint() - 1) {
          inStatementIds.add(range.lowerEndpoint());
        } else {
          expression = collectOrStatement(expression, mapRow.sourceCode.index.between(range.lowerEndpoint(), range.upperEndpoint() - 1));
        }
      }

      if (inStatementIds.size() > 0) {
        expression = collectOrStatement(expression, mapRow.sourceCode.index.in(inStatementIds));
      }

      if (expression != null) {
        whereClause = whereClause.and(expression);
      }
    }
    return whereClause;
  }

  private BooleanExpression collectOrStatement(BooleanExpression expression, BooleanExpression betweenStatement) {
    if (expression == null) {
      return betweenStatement;
    }
    return expression.or(betweenStatement);
  }

  private Long getImportedCodeSetSize(Task task) {
    ImportedCode sourceCodeExample = new ImportedCode();
    sourceCodeExample.setImportedCodeSet(task.getMap().getSource());
    long count = importedCodeRepository.count(Example.of(sourceCodeExample));
    return count;
  }

  private void setMapRows(Task task) {
    RangeSet<Long> rangeSet = SourceRowSpecificationUtils.convertSourceRowSpecificationToRangeSet(
        task.getSourceRowSpecification());

    associateMapRows(task, rangeSet);

    /**
     * By reassigning rows to different tasks, it is possible for a task to become "empty" i.e. have no rows associated with it. This case
     * will be handled by deleting these tasks.
     */
    taskRepository.deleteTasksWithNoMapRows();
  }
  
  private void associateMapRows(Task task, RangeSet<Long> rangeSet) {
    BiConsumer<Long, Long> addRange;
    Consumer<Set<Long>> addCollection;

    Instant modified = Instant.now();
    String user = authenticationFacade.getPrincipalSubject();
    if (task.getType().equals(TaskType.AUTHOR)) {
      addRange = (lower, upper) ->
          mapRowRepository.setAuthorTaskBySourceCodeRange(task, lower, upper, modified, user);
      addCollection = (ids) -> mapRowRepository.setAuthorTaskBySourceCode(task, ids, modified, user);
    } else if (task.getType().equals(TaskType.REVIEW)) {
      addRange = (lower, upper) ->
          mapRowRepository.setReviewTaskBySourceCodeRange(task, lower, upper, modified, user);
      addCollection = (ids) ->
          mapRowRepository.setReviewTaskBySourceCode(task, ids, modified, user);
    } else {
      throw Problem.builder().withTitle("Unknown task type " + task.getType()).withStatus(
          Status.INTERNAL_SERVER_ERROR).build();
    }

    processRange(rangeSet, addRange, addCollection);
  }

  private void processRange(RangeSet<Long> rangeSet, BiConsumer<Long, Long> processRange,
      Consumer<Set<Long>> processCollection) {
    if (rangeSet.encloses(Range.all())) {
      processRange.accept(0L, Long.MAX_VALUE);
    } else {
      Set<Long> singleIndexes = new HashSet<>();
      for (Range<Long> range : rangeSet.asRanges()) {
        if (range.upperBoundType().equals(BoundType.CLOSED)) {
          processRange.accept(range.lowerEndpoint(), range.upperEndpoint());
        } else if (range.lowerEndpoint() == range.upperEndpoint() - 1) {
          singleIndexes.add(range.lowerEndpoint());
        } else {
          processRange.accept(range.lowerEndpoint(), range.upperEndpoint() - 1);
        }
      }
      if (singleIndexes.size() > 0) {
        processCollection.accept(singleIndexes);
      }
    }
  }
}
