package org.snomed.snap2snomed.model.enumeration;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvFileSource;

class MapStatusTest {

  @ParameterizedTest()
  @CsvFileSource(resources = "/MapStatusTestValidTransitions.csv", numLinesToSkip = 1)
  void isValidTransition(MapStatus from, MapStatus to, boolean expected) {
    assertEquals(expected, from.isValidTransition(to));
  }

  @Test
  void isAuthorState() {
    assertTrue(MapStatus.UNMAPPED.isAuthorState());
    assertTrue(MapStatus.DRAFT.isAuthorState());
    assertTrue(MapStatus.MAPPED.isAuthorState());
    assertFalse(MapStatus.INREVIEW.isAuthorState());
    assertFalse(MapStatus.ACCEPTED.isAuthorState());
    assertFalse(MapStatus.REJECTED.isAuthorState());
  }

  @Test
  void getCompletedAuthorStatuses() {
    assertArrayEquals(new MapStatus[]{MapStatus.MAPPED, MapStatus.INREVIEW, MapStatus.ACCEPTED},
        MapStatus.getCompletedAuthorStatuses().toArray());
  }

  @Test
  void getCompletedReviewStatuses() {
    assertArrayEquals(new MapStatus[]{MapStatus.ACCEPTED, MapStatus.REJECTED},
        MapStatus.getCompletedReviewStatuses().toArray());
  }
}