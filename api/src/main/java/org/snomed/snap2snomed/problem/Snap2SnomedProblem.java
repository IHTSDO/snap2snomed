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

package org.snomed.snap2snomed.problem;

import java.net.URI;
import org.zalando.problem.AbstractThrowableProblem;
import org.zalando.problem.Status;

public abstract class Snap2SnomedProblem extends AbstractThrowableProblem {

  public static final String BASE_PROBLEM_TYPE_URI = "http://snap2snomed.app/problem/";

  private static final long serialVersionUID = 1L;

  public Snap2SnomedProblem(String uriSubPath, String title, Status status, String detail) {
    super(toTypeUri(uriSubPath), title, status, detail);
  }

  public Snap2SnomedProblem(String uriSubPath, String title, Status status) {
    this(uriSubPath, title, status, null);
  }

  protected static URI toTypeUri(String subtype) {
    return URI.create(BASE_PROBLEM_TYPE_URI + subtype);
  }
}
