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

package org.snomed.snap2snomed.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.SortedSet;
import java.util.TreeSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class NoteComparatorTest {

  Note note;
  Note note2;
  Instant time1, time2;

  @BeforeEach
  public void beforeTest() {
    note = new Note();
    note.setId(1L);
    note2 = new Note();
    note2.setId(2L);
    time1 = Instant.now();
    time2 = time1.plusSeconds(60);
  }

  @Test
  public void testNull() {
    note.setCreated(null);
    note.setModified(null);
    note.setId(null);

    note2.setCreated(null);
    note2.setModified(null);
    note2.setId(null);

    assertThat(note.compareTo(note2)).isEqualTo(0);
  }

  @Test
  public void testSameObject() {
    assertThat(note.compareTo(note)).isEqualTo(0);
  }

  @Test
  public void testEqual() {
    note.setCreated(time1);
    note.setModified(time1);
    note.setId(0L);

    note2.setCreated(time1);
    note2.setModified(time1);
    note2.setId(0L);

    assertThat(note.compareTo(note2)).isEqualTo(0);
  }

  @Test
  public void testDifferentCreatedOnly() {
    note.setCreated(time1);
    note.setModified(time1);

    note2.setCreated(time2);
    note2.setModified(time1);

    assertThat(note.compareTo(note2)).isEqualTo(1);
  }

  @Test
  public void testDifferentModifiedOnly() {
    note.setCreated(time1);
    note.setModified(time2);

    note2.setCreated(time1);
    note2.setModified(time1);

    assertThat(note.compareTo(note2)).isEqualTo(-1);
  }

  @Test
  public void testModifiedMattersMoreCreated() {
    note.setCreated(time1);
    note.setModified(time2);

    note2.setCreated(time2);
    note2.setModified(time1);

    assertThat(note.compareTo(note2)).isEqualTo(-1);
  }

  @Test
  public void testSortedSet() {
    SortedSet<Note> set = new TreeSet<>();

    note.setCreated(time1);
    note.setModified(time2);
    set.add(note);

    note2.setCreated(time2);
    note2.setModified(time1);
    set.add(note2);

    var note3 = new Note();
    note3.setId(3L);
    note3.setCreated(time2);
    note3.setModified(time2);
    set.add(note3);

    assertThat(set).containsExactly(note3, note, note2);
  }
}