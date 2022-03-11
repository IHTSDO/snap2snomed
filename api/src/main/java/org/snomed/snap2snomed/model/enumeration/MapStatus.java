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

package org.snomed.snap2snomed.model.enumeration;

import java.util.List;

public enum MapStatus {
  UNMAPPED {
    @Override
    public Boolean isValidTransition(MapStatus mapStatus) {
      if ( mapStatus == UNMAPPED || mapStatus == DRAFT || mapStatus == MAPPED ) {
        return true;
      }
      return false;
    }
    @Override
    public Boolean isValidTransitionForRole(MapStatus mapStatus, Role role) {
      return (role == Role.AUTHOR) && isValidTransition(mapStatus);
    }
  },
  DRAFT {
    @Override
    public Boolean isValidTransition(MapStatus mapStatus) {
      if ( mapStatus == DRAFT || mapStatus == UNMAPPED || mapStatus == MAPPED ) {
        return true;
      }
      return false;
    }
    @Override
    public Boolean isValidTransitionForRole(MapStatus mapStatus, Role role) {
      return (role == Role.AUTHOR) && isValidTransition(mapStatus);
    }
  },
  MAPPED {
    @Override
    public Boolean isValidTransition(MapStatus mapStatus) {
      if ( mapStatus == UNMAPPED || mapStatus == DRAFT
        || mapStatus == INREVIEW || mapStatus == ACCEPTED
        || mapStatus == REJECTED || mapStatus == MAPPED ) {
        return true;
      }
      return false;
    }
    @Override
    public Boolean isValidTransitionForRole(MapStatus mapStatus, Role role) {
      // This is the transition boundary between Author and Reviewer.
      // Authors can only transition to author status and
      // reviewers can only transition to a review status
      if (role == Role.AUTHOR) {
        return isAuthorTransition(mapStatus);
      } else if (role == Role.REVIEWER) {
        return isReviewTransition(mapStatus);
      }
      return false;
    }
  },
  INREVIEW {
    @Override
    public Boolean isValidTransition(MapStatus mapStatus) {
      if (mapStatus == INREVIEW || mapStatus == ACCEPTED
          || mapStatus == REJECTED) {
        return true;
      }
      return false;
    }
    @Override
    public Boolean isValidTransitionForRole(MapStatus mapStatus, Role role) {
      return (role == Role.REVIEWER) && isValidTransition(mapStatus);
    }
  },
  ACCEPTED {
    @Override
    public Boolean isValidTransition(MapStatus mapStatus) {
      if ( mapStatus == INREVIEW || mapStatus == REJECTED
        || mapStatus == ACCEPTED ) {
        return true;
      }
      return false;
    }    
    @Override
    public Boolean isValidTransitionForRole(MapStatus mapStatus, Role role) {
      return (role == Role.REVIEWER) && isValidTransition(mapStatus);
    }
  },
  REJECTED {
    @Override
    public Boolean isValidTransition(MapStatus mapStatus) {
      if ( mapStatus == UNMAPPED || mapStatus == DRAFT
        || mapStatus == INREVIEW || mapStatus == ACCEPTED
        || mapStatus == REJECTED || mapStatus == MAPPED ) {
        return true;
      }
      return false;
    }    
    @Override
    public Boolean isValidTransitionForRole(MapStatus mapStatus, Role role) {
      // This is another transition boundary between Author and Reviewer.
      // Authors can only transition back to author status and
      // reviewers can only transition to a review status
      if (role == Role.AUTHOR) {
        return isAuthorTransition(mapStatus);
      } else if (role == Role.REVIEWER) {
        return isReviewTransition(mapStatus);
      }
      return false;
    }
  };

  public static enum Role {
    AUTHOR("Author", "authoring"),
    REVIEWER("Reviewer", "review");

    private String name;
    private String stateName;

    Role(String theName, String theStateName) {
      this.name = theName;
      this.stateName = theStateName;
    }
    public String getName() {
      return name;
    }
    public String getStateName() {
      return stateName;
    }
  }

  public abstract Boolean isValidTransition(MapStatus mapStatus);
  public abstract Boolean isValidTransitionForRole(MapStatus mapStatus, Role role);

  private static final List<MapStatus> authorCompleteStatuses = List.of(MapStatus.MAPPED, MapStatus.INREVIEW, MapStatus.ACCEPTED);
  private static final List<MapStatus> reviewCompleteStatuses = List.of(MapStatus.ACCEPTED, MapStatus.REJECTED);

  public boolean isAuthorState() {
    return this.equals(UNMAPPED) || this.equals(DRAFT) || this.equals(MAPPED);
  }

  public Boolean isAuthorTransition(MapStatus status) {
    return status.equals(UNMAPPED) || status.equals(DRAFT) || status.equals(MAPPED);
  }

  public Boolean isReviewTransition(MapStatus status) {
    return status.equals(ACCEPTED) || status.equals(REJECTED) || status.equals(INREVIEW);
  }

  public static List<MapStatus> getCompletedAuthorStatuses() {
    return authorCompleteStatuses;
  }

  public static List<MapStatus> getCompletedReviewStatuses() {
    return reviewCompleteStatuses;
  }
}



