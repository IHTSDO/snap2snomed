/*
 * Copyright © 2026 SNOMED International
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

package org.snomed.snap2snomed.integration.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.io.IOException;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.snomed.snap2snomed.integration.IntegrationTestBase;
import org.snomed.snap2snomed.model.MapRow;
import org.snomed.snap2snomed.model.enumeration.MapStatus;
import org.snomed.snap2snomed.model.enumeration.TaskType;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Reproduces a dual-map scenario with two different authors assigned to the two sibling rows
 * that share a source code index, and verifies both show up in the general map view's
 * "assignedAuthor" column (GET /mapView/{mapId}, not scoped to a task).
 *
 * Creating a Map under a dual-map-mode Project automatically creates two MapRows per source
 * code, both blindMapFlag=true (see MapEventHandler.handleMapAfterCreate). Two AUTHOR tasks
 * created over the same row range then each claim one sibling row per index - the first task
 * claims the lower-id row of each pair, the second claims the higher-id row (see
 * MapRowRepository.setAuthorTaskBySourceCodeDualMap's "author_task_id is null" + "id < mr.id"
 * guards) - reproducing the exact "two different authors for the same source code" case.
 */
@TestInstance(Lifecycle.PER_CLASS)
public class DualMapViewControllerIT extends IntegrationTestBase {

  private final String user1 = "dual-map-author-1";
  private final String user2 = "dual-map-author-2";

  private long mapId;
  private long user1AuthorTaskId;

  @Autowired
  private MapRowRepository mapRowRepository;

  @Override
  protected void beforeTests() throws IOException {
    restClient.createOrUpdateUser(DEFAULT_TEST_USER_SUBJECT, "Test", "Bobby", "User", "test@user.com");
    restClient.createOrUpdateUser(user1, "First", "First", "Author", "author1@user.com");
    restClient.createOrUpdateUser(user2, "Second", "Second", "Author", "author2@user.com");

    final long projectId = restClient.createProject(DEFAULT_TEST_USER_SUBJECT, "DualMapProjectDemo", "Dual Map Demo Project",
        Set.of(DEFAULT_TEST_USER_SUBJECT), Set.of(user1, user2), Set.of(), true);

    final long codesetId = restClient.createImportedCodeSet("dual map code set", "1.2.3", 10);

    mapId = restClient.createMap("Dual Map Testing Version", "http://snomed.info/sct/32506021000036107/version/20210531",
        "http://map.test.toscope", projectId, codesetId);

    user1AuthorTaskId = restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, user1, "*", true, false, "First author task");
    restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.AUTHOR, mapId, user2, "*", true, false, "Second author task");
  }

  @Test
  public void shouldShowBothAuthorsInAssignedAuthorColumnForDualMapRow() {
    restClient.givenUser(DEFAULT_TEST_USER_SUBJECT)
        .queryParam("size", 100)
        .queryParam("sort", "sourceIndex")
        .get("/mapView/" + mapId)
        .then().statusCode(200)
        .body("content", hasSize(10))
        .body("content[0].assignedAuthor", hasSize(2))
        .body("content[0].assignedAuthor.id", containsInAnyOrder(user1, user2));
  }

  /**
   * Regression test for a bug where MapViewService's native-SQL filter builder (used only for
   * dual-map-mode's "all results" - no task - overview query, ie exactly this endpoint) joined
   * AND/OR clause fragments via bare string concatenation with no parentheses. Because the
   * lastAuthorReviewer filter is itself always an OR of two conditions
   * ("last_author_id IN (...) OR last_reviewer_id IN (...)"), splicing it into the rest of the
   * WHERE clause with an unparenthesized " AND " let SQL's AND-before-OR precedence detach the
   * last_reviewer_id half from every other filter condition - so a row whose last_reviewer_id
   * matched the filter leaked through regardless of any other filter applied alongside it.
   *
   * Resolves both blind siblings first (merging into one non-blind row, same as
   * shouldShowLastAuthorInGeneralMapView) rather than leaving the row blind - lastAuthorReviewer
   * now also excludes still-blind rows outright (see shouldExcludeStillBlindRowFromFilter), which
   * would otherwise mask this precedence bug behind a different, unrelated reason for exclusion.
   */
  @Test
  public void shouldNotLeakRowsWhenCombiningLastAuthorReviewerWithAnotherFilter() throws Exception {
    // Uses a different row than shouldShowBothAuthorsInAssignedAuthorColumnForDualMapRow - this
    // class is @TestInstance(PER_CLASS), so fixture state (map rows) is shared across test
    // methods, and mutating "map row code 1." would corrupt that other test's content[0] checks.
    final long mapRowId = restClient.getMapRowId(mapId, "map row code 5.");
    final MapRow mapRow = mapRowRepository.findById(mapRowId).orElseThrow();
    final long siblingRowId = mapRowRepository
        .findDualMapSiblingRow(mapId, mapRow.getSourceCode().getId(), mapRowId).getId();

    // Same target on both sides (noMap=true) so they resolve as equivalent and merge into one
    // (non-blind) row - merging consolidates the pair down to a single surviving row id, so
    // mapRowId itself is no longer valid afterward (a PATCH against it 404s).
    restClient.updateNoMapAndStatus(user1, mapRowId, true, MapStatus.MAPPED);
    restClient.updateNoMapAndStatus(user2, siblingRowId, true, MapStatus.MAPPED);
    final long mergedRowId = restClient.getMapRowId(mapId, "map row code 5.");

    // Drive the merged row to a reviewer-state status as user1, so mapRow.lastReviewer is
    // genuinely set to user1 via the same MapRowEventHandler.updateLastAuthorOrReviewed path a
    // real review would use.
    restClient.createTask(DEFAULT_TEST_USER_SUBJECT, TaskType.REVIEW, mapId, user1, "*", true, false, "Review task for regression test");
    restClient.updateStatus(user1, mergedRowId, MapStatus.INREVIEW);

    // sourceCode filter alone matches nothing - if lastAuthorReviewer were correctly AND-ed in,
    // the result should stay empty. Before the fix, the row set up above leaked back in via the
    // detached "OR last_reviewer_id IN (...)" branch.
    restClient.givenUser(DEFAULT_TEST_USER_SUBJECT)
        .queryParam("sourceCode", "this-code-does-not-exist")
        .queryParam("lastAuthorReviewer", user1)
        .get("/mapView/" + mapId)
        .then().statusCode(200)
        .body("page.totalElements", is(0));
  }

  /**
   * Checks whether the same "Jackson serializes a genuinely-loaded association as null" issue
   * fixed for siblingRowAuthorTask.getAssignee() (see MapView.java) also affects lastAuthor -
   * both are direct associations resolved via getter on a MapRow/Task built through the same
   * custom DbMapView "DualMapViewResult" @SqlResultSetMapping (see MapViewService.getMapResults),
   * as opposed to row.getAuthorTask().getAssignee(), which resolves through a standard Hibernate
   * proxy dereference once past the first native-query-constructed entity and was unaffected.
   *
   * lastAuthor is only surfaced once a row is no longer "blind" (see MapView's constructor -
   * a blind row explicitly nulls it out regardless), which only happens once both dual-map
   * siblings have been mapped - so both must be resolved here, not just one, to actually
   * exercise the Jackson/proxy behaviour rather than the (correct) blind-row nulling.
   */
  @Test
  public void shouldShowLastAuthorInGeneralMapView() throws Exception {
    final long mapRowId = restClient.getMapRowId(mapId, "map row code 8.");
    final MapRow mapRow = mapRowRepository.findById(mapRowId).orElseThrow();
    final long siblingRowId = mapRowRepository
        .findDualMapSiblingRow(mapId, mapRow.getSourceCode().getId(), mapRowId).getId();

    // Same target on both sides (noMap=true) so they resolve as equivalent and merge into one
    // row rather than diverging into a RECONCILE state - keeps the map view's row count/indexing
    // exactly as the other tests in this class expect.
    restClient.updateNoMapAndStatus(user1, mapRowId, true, MapStatus.MAPPED);
    restClient.updateNoMapAndStatus(user2, siblingRowId, true, MapStatus.MAPPED);

    restClient.givenUser(DEFAULT_TEST_USER_SUBJECT)
        .queryParam("size", 100)
        .queryParam("sort", "sourceIndex")
        .get("/mapView/" + mapId)
        .then().statusCode(200)
        .body("content[7].lastAuthor.id", notNullValue());
  }

  /**
   * Regression test for the "assignedAuthor" filter only ever matching a blind dual-map row's
   * primary/collapsed author (assigned_author_user, joined off task3_) and never its second,
   * sibling author (previously flagged in code as "TODO assigned author not picking up second
   * author"). Fixed by joining sibling_assigned_author_user off task12_ (the sibling task, see
   * map_view.sibling_row_author_task_id) and OR-ing it into the filter condition.
   *
   * Uses "map row code 1." specifically because it's read-only in every other test in this
   * class - other tests mutate their own rows towards MAPPED/merged states, which would make an
   * exact-count assertion on a shared row order-dependent.
   */
  @Test
  public void shouldFilterByEitherAuthorInDualMapView() {
    restClient.givenUser(DEFAULT_TEST_USER_SUBJECT)
        .queryParam("sourceCode", "map row code 1.")
        .queryParam("assignedAuthor", user2)
        .get("/mapView/" + mapId)
        .then().statusCode(200)
        .body("content", hasSize(1))
        .body("content[0].sourceCode", is("map row code 1."));
  }

  /**
   * Same "genuinely-loaded association serialized as null" risk, but for the separate
   * "dual map mode - task screen" MapView constructor (used by /mapView/task/{taskId}, ie the
   * mapping-work screen an author/reviewer actually works from) rather than the "view screen"
   * constructor the other tests above exercise via /mapView/{mapId}.
   */
  @Test
  public void shouldShowLastAuthorInTaskScopedDualMapView() throws Exception {
    final long mapRowId = restClient.getMapRowId(mapId, "map row code 9.");
    restClient.updateNoMapAndStatus(user1, mapRowId, true, MapStatus.MAPPED);

    restClient.givenUser(user1)
        .queryParam("size", 100)
        .queryParam("sort", "sourceIndex")
        .get("/mapView/task/" + user1AuthorTaskId)
        .then().statusCode(200)
        .body("content.find { it.rowId == " + mapRowId + " }.lastAuthor.id", is(user1));
  }

  /**
   * Directly reproduces the originally-reported scenario: a row that's still blind (its sibling
   * hasn't independently resolved yet) must not appear when filtering by lastAuthorReviewer for
   * the user who actually last touched it, even though the underlying last_author_id genuinely
   * matches - since that identity is exactly what's meant to stay hidden until both blind
   * siblings resolve (merge into MAPPED, or diverge into RECONCILE), the filter shouldn't be able
   * to single the row out either. Contrast with shouldNotLeakRows... below, which uses a
   * resolved (non-blind) row so that test stays isolated to the AND/OR precedence bug alone.
   */
  @Test
  public void shouldExcludeStillBlindRowFromLastAuthorReviewerFilter() throws Exception {
    final long mapRowId = restClient.getMapRowId(mapId, "map row code 6.");
    restClient.updateNoMapAndStatus(user1, mapRowId, true, MapStatus.MAPPED);

    restClient.givenUser(DEFAULT_TEST_USER_SUBJECT)
        .queryParam("lastAuthorReviewer", user1)
        .get("/mapView/" + mapId)
        .then().statusCode(200)
        .body("content.find { it.rowId == " + mapRowId + " }", nullValue());
  }
}
