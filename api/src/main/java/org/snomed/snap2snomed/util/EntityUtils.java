package org.snomed.snap2snomed.util;

import java.util.Objects;
import org.snomed.snap2snomed.model.Snap2SnomedEntity;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.model.User;

public class EntityUtils {

  public static boolean areEqual(Snap2SnomedEntity entity1, Snap2SnomedEntity entity2) {
    if (entity1 != null && entity2 != null) {
      return Objects.equals(entity1.getId(), entity2.getId());
    }
    return entity1 == entity2; // equal if both null
  }

  public static boolean isTaskAssignee(User currentUser, Task task) {
    return task != null && currentUser != null && isTaskAssignee(currentUser.getId(), task);
  }

  public static boolean isTaskAssignee(String subject, Task task) {
    return task != null && task.getAssignee().getId().equals(subject);
  }
}
