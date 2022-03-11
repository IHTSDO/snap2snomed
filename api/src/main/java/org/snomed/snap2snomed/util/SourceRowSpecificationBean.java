package org.snomed.snap2snomed.util;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.snomed.snap2snomed.controller.dto.IndexSpecification;
import org.snomed.snap2snomed.model.Task;
import org.snomed.snap2snomed.repository.ImportedCodeRepository;
import org.snomed.snap2snomed.repository.MapRowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class SourceRowSpecificationBean {

  @Autowired
  MapRowRepository mapRowRepository;

  @Autowired
  ImportedCodeRepository importedCodeRepository;

  public Long calculateSourceRowCount(Task task) {
    List<Long> sourceIndexes = mapRowRepository.getSourceRowIndexesForTask(task);

    if (sourceIndexes.isEmpty()) {
      log.error("Task " + task.getId() + " has no source rows associated with it");
      return 0L;
    }

    IndexSpecification specification = IndexSpecification.of(sourceIndexes,
        importedCodeRepository.findLargestSourceIndexForCodeSet(task.getMap().getSource()));

    return specification.getCount();
  }

  public String calculateSourceRowSpecification(Task task) {
    if (task.getSourceRowSpecification() != null) {
      return task.getSourceRowSpecification();
    }

    List<Long> sourceIndexes = mapRowRepository.getSourceRowIndexesForTask(task);

    if (sourceIndexes.isEmpty()) {
      log.error("Task " + task.getId() + " has no source rows associated with it");
      return "";
    }

    IndexSpecification specification = IndexSpecification.of(sourceIndexes,
        importedCodeRepository.findLargestSourceIndexForCodeSet(task.getMap().getSource()));

    return specification.getSpecification();
  }
}
