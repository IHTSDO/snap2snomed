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

import com.google.common.collect.BoundType;
import com.google.common.collect.Range;
import com.google.common.collect.RangeSet;
import com.google.common.collect.TreeRangeSet;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.logging.log4j.util.Strings;
import org.snomed.snap2snomed.problem.task.TaskSpecificationProblem;


public class SourceRowSpecificationUtils {

  public static final String SOURCE_ROW_SPECIFICATION_PATTERN = "(\\*|[1-9]\\d*+(-[1-9]\\d*+)?+(,[1-9]\\d*+(-[1-9]\\d*+)?)*+)";

  private static final Pattern sourceRowSpecificationPattern = Pattern.compile(SOURCE_ROW_SPECIFICATION_PATTERN);

  public static RangeSet<Long> convertSourceRowSpecificationToRangeSet(String sourceRowSpecification) {
    if (sourceRowSpecification == null || !sourceRowSpecificationPattern.matcher(sourceRowSpecification).matches()) {
      throw new TaskSpecificationProblem("Does not match the expected pattern for source row specifications "
          + "- digits or ranges separated by columns or the wildcard '*', e.g. '*' or '1,2,5-10'");
    }

    RangeSet<Long> rangeSet = TreeRangeSet.create();
    try {
      if (sourceRowSpecification.equals("*")) {
        rangeSet.add(Range.all());
      } else {
        for (String element : sourceRowSpecification.split(",")) {
          if (element.contains("-")) {
            String[] values = element.split("-");
            Long lowerEnd, upperEnd;

            if (Long.parseLong(values[0]) < Long.parseLong(values[1])) {
              lowerEnd = Long.parseLong(values[0]);
              upperEnd = Long.parseLong(values[1]);
            } else {
              lowerEnd = Long.parseLong(values[1]);
              upperEnd = Long.parseLong(values[0]);
            }
            rangeSet.add(Range.closed(lowerEnd, upperEnd));
          } else {
            Long value = Long.parseLong(element);
            rangeSet.add(Range.closedOpen(value, value + 1));
          }
        }
      }
      return rangeSet;
    } catch (NumberFormatException e) {
      throw new TaskSpecificationProblem(
          "One of the parts of the specification expected to be a number could not be parsed - " + e.getMessage());
    }
  }

  public static String convertRangeSetToSourceRowSpecification(RangeSet<Long> rangeSet) {
    List<String> result = new ArrayList<>();

    if (rangeSet.encloses(Range.all())) {
      return "*";
    } else {
      for (Range<Long> range : rangeSet.asRanges()) {
        if (range.upperBoundType().equals(BoundType.CLOSED)) {
          result.add(range.lowerEndpoint() + "-" + range.upperEndpoint());
        } else if (range.lowerEndpoint() == range.upperEndpoint() - 1) {
          result.add(range.lowerEndpoint().toString());
        } else {
          result.add(range.lowerEndpoint() + "-" + (range.upperEndpoint() - 1));
        }
      }
      return Strings.join(result, ',');
    }
  }

  public static String normalise(String sourceRowSpecification, long limit) {
    RangeSet<Long> rangeSet = convertSourceRowSpecificationToRangeSet(sourceRowSpecification);

    return normalise(limit, rangeSet);
  }

  public static String normalise(long limit, RangeSet<Long> rangeSet) {
    if (limit < 1) {
      throw new TaskSpecificationProblem("The total size of the code set to apply the source row specification to is 0");
    }

    RangeSet<Long> adjustedRangeSet = normaliseRangeSet(limit, rangeSet);

    if (adjustedRangeSet.isEmpty()) {
      throw new TaskSpecificationProblem("Source row specification '" + rangeSet.toString()
          + "' does not specify any rows in the range of the related code set which spans rows '1-" + limit);
    }

    return convertRangeSetToSourceRowSpecification(adjustedRangeSet);
  }

  private static RangeSet<Long> normaliseRangeSet(long limit, RangeSet<Long> rangeSet) {
    RangeSet<Long> adjustedRangeSet = TreeRangeSet.create();

    if (rangeSet.encloses(Range.closed(1L, limit))) {
      adjustedRangeSet.add(Range.all());
    } else {
      for (Range<Long> range : rangeSet.asRanges()) {
        if (range.lowerEndpoint() == limit) {
          adjustedRangeSet.add(Range.closedOpen(range.lowerEndpoint(), limit + 1));
        } else if (range.lowerEndpoint() < limit) {
          if (range.upperBoundType().equals(BoundType.OPEN) && range.upperEndpoint() > limit + 1) {
            adjustedRangeSet.add(Range.closedOpen(range.lowerEndpoint(), limit + 1));
          } else if (range.upperBoundType().equals(BoundType.CLOSED) && range.upperEndpoint() > limit) {
            adjustedRangeSet.add(Range.closed(range.lowerEndpoint(), limit));
          } else {
            adjustedRangeSet.add(range);
          }
        }
      }
    }
    return adjustedRangeSet;
  }

  public static Pair<String, Long> calculateSpecification(Collection<Long> indexes, Long limit) {
    RangeSet<Long> rangeSet = TreeRangeSet.create();

    indexes.stream().forEach(i -> rangeSet.add(Range.closedOpen(i, i + 1)));

    return Pair.of(normalise(limit, rangeSet), Long.valueOf(indexes.size()));
  }

  public static Pair<String, Long> calculateSpecification(String specification, Long limit) {
    return calculateSpecification(specification, limit, null);
  }

  public static Pair<String, Long> calculateSpecification(String specification, Long limit, Set<Long> substractions) {
    RangeSet<Long> rangeSet = normaliseRangeSet(limit, convertSourceRowSpecificationToRangeSet(specification));

    if (substractions != null && !substractions.isEmpty()) {
      if (rangeSet.encloses(Range.all())) {
        rangeSet.clear();
        rangeSet.add(Range.closed(1L, limit));
      }
      substractions.stream().forEach(i -> rangeSet.remove(Range.closedOpen(i, i + 1)));

      if (rangeSet.isEmpty()) {
        return Pair.of(null, 0L);
      }
    }

    long count = 0;
    if (rangeSet.encloses(Range.all())) {
      count = limit;
    } else {
      for (Range<Long> range : rangeSet.asRanges()) {
        long upperBound = range.upperEndpoint();
        long lowerBound = range.lowerEndpoint();

        if (range.upperBoundType().equals(BoundType.CLOSED)) {
          upperBound += 1;
        }

        if (range.lowerBoundType().equals(BoundType.OPEN)) {
          lowerBound += 1;
        }

        count += upperBound - lowerBound;
      }
    }

    return Pair.of(normalise(limit, rangeSet), count);
  }
}
