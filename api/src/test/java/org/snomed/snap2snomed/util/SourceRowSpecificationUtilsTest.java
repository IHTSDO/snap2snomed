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

package org.snomed.snap2snomed.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.snomed.snap2snomed.problem.task.TaskSpecificationProblem;

class SourceRowSpecificationUtilsTest {

  @ParameterizedTest()
  @NullAndEmptySource
  @ValueSource(strings = {",", "1,", "1-", "-1", "12,,3", " 2", "1--2", ",1,2", "0", "0-10", "9-0", "1,0-9", "1-5,0-9", "1-5,9-0",
      Long.MAX_VALUE + "1", "1-" + Long.MAX_VALUE + "1", "*,1", "1,*", "*,3-10"})
  void invalidSourceRowSpecification(String input) {
    assertThrows(TaskSpecificationProblem.class, () -> SourceRowSpecificationUtils.convertSourceRowSpecificationToRangeSet(input));
  }

  @ParameterizedTest()
  @CsvSource(value = {"1-5:1-5", "1:1", "5-2:2-5", "3,2,5,4:2-5", "5,4,5-10,3,2:2-10",
      "2,5,4,3,15-40,1,9,7,8,50-35,23-26,12-20:1-5,7-9,12-50", "1-" + Long.MAX_VALUE + ":" + "1-" + Long.MAX_VALUE, "*:*"}, delimiter = ':')
  void validSourceRowSpecifications(String input, String expected) {
    assertThat(SourceRowSpecificationUtils
        .convertRangeSetToSourceRowSpecification(SourceRowSpecificationUtils.convertSourceRowSpecificationToRangeSet(input)))
            .isEqualTo(expected);
  }

  @ParameterizedTest()
  @CsvSource(
      value = {"1-5:6:1-5", "1-5:5:*", "1:6:1", "1:1:*", "5-2:4:2-4", "3,2,5,4:4:2-4", "5,4,5-10,3,2:7:2-7",
          "2,5,4,3,15-40,1,9,7,8,50-35,23-26,12-20:100:1-5,7-9,12-50", "3-5:3:3", "3:3:3", "1,2,3:3:*", "1,2,3,4:3:*", "2,3:3:2-3",
          "1-" + Long.MAX_VALUE + ":" + Long.MAX_VALUE + ":*", "*:1:*"},
      delimiter = ':')
  void validNormaliseSourceRowSpecifications(String input, Long limit, String expected) {
    assertThat(SourceRowSpecificationUtils.normalise(input, limit)).isEqualTo(expected);
  }

  @ParameterizedTest()
  @CsvSource(
      value = {"1-5:6:1-5:5", "1-5:5:*:5", "1:6:1:1", "1:1:*:1", "5-2:4:2-4:3", "3,2,5,4:4:2-4:3", "5,4,5-10,3,2:7:2-7:6",
          "2,5,4,3,15-40,1,9,7,8,50-35,23-26,12-20:100:1-5,7-9,12-50:47", "3-5:3:3:1", "3:3:3:1", "1,2,3:3:*:3", "1,2,3,4:3:*:3",
          "2,3:3:2-3:2", "1-" + Long.MAX_VALUE + ":" + Long.MAX_VALUE + ":*:" + Long.MAX_VALUE, "*:1:*:1"},
      delimiter = ':')
  void validNormaliseSourceRowSpecificationsWithCounts(String input, Long limit, String expectedSpecification, Long expectedCount) {
    Pair<String, Long> result = SourceRowSpecificationUtils.calculateSpecification(input, limit);
    assertThat(result.getLeft()).isEqualTo(expectedSpecification);
    assertThat(result.getRight()).isEqualTo(expectedCount);
  }

  @ParameterizedTest()
  @CsvSource(
      value = {"1-5:0", "3-5:2", "3:2", ",:5", "1,:5", "1-:5", "-1:5", "12,,3:5", "\" 2\":5",
          "1--2:5", ",1,2:5", "0:5", "0-10:5", "9-0:5",
          "1,0-9:5", "1-5,0-9:5", "1-5,9-0:5", Long.MAX_VALUE + "1:" + Long.MAX_VALUE,
          "1-" + Long.MAX_VALUE + "1:" + Long.MAX_VALUE,
          "*,1:5", "1,*:5", "*,3-10:100"},
      delimiter = ':')
  void invalidNormaliseSourceRowSpecifications(String input, Long limit) {
    assertThrows(TaskSpecificationProblem.class,
        () -> SourceRowSpecificationUtils.normalise(input, limit));
  }

  @ParameterizedTest()
  @CsvSource(
      value = {
          "137,146,186,222,488-524,597-625,660-673,691-698,751-753,764-768,839-843,859,861-862,951-952,1165-1168,1170,1172-1174,1176-1220,1222-1223,1226-1236,1252,1254,1264-1267,1422-1423,1466-1494,1498,1726,1740,1788,1823-1828,1837-1839,1850-1853,1882,1901-1903,1920,1925-1927,1960-1962,1984,2007,2031-2034,2038:2037:137,146,186,222,488-524,597-625,660-673,691-698,751-753,764-768,839-843,859,861-862,951-952,1165-1168,1170,1172-1174,1176-1220,1222-1223,1226-1236,1252,1254,1264-1267,1422-1423,1466-1494,1498,1726,1740,1788,1823-1828,1837-1839,1850-1853,1882,1901-1903,1920,1925-1927,1960-1962,1984,2007,2031-2034"},
      delimiter = ':')
  void validLongNormalisation(String input, Long limit, String expected) {
    assertThat(SourceRowSpecificationUtils.normalise(input, limit)).isEqualTo(
        expected);
  }


}
