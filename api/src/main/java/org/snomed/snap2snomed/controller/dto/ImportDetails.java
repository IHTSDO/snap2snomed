package org.snomed.snap2snomed.controller.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import org.snomed.snap2snomed.model.ImportedCodeSet;
import lombok.Data;

@Data
public class ImportDetails {

  @NotBlank(message = "name is mandatory")
  @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
  String name;

  @NotBlank(message = "version is mandatory")
  @Size(min = 1, max = 30, message = "Version must be between 1 and 30 characters")
  String version;

  @NotNull(message = "An index for the codes in a code set import file must be specified")
  Integer codeColumnIndex;

  @NotNull(message = "An index for the display text in a code set import file must be specified")
  Integer displayColumnIndex;

  Character delimiter;

  Boolean hasHeader = false;

  public ImportedCodeSet toImportedCodeSetEntity() {
    ImportedCodeSet codeset = new ImportedCodeSet();

    codeset.setName(name);
    codeset.setVersion(version);

    return codeset;
  }
}
