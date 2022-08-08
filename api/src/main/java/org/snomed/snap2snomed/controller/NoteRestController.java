package org.snomed.snap2snomed.controller;

import org.snomed.snap2snomed.problem.auth.NoSuchUserProblem;
import org.snomed.snap2snomed.security.WebSecurity;
import org.snomed.snap2snomed.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
public class NoteRestController {
  @Autowired private NoteService noteService;
  @Autowired private WebSecurity webSecurity;

  @ResponseStatus(value= HttpStatus.NO_CONTENT)
  @DeleteMapping(path="/notes/delete/{noteId}")
  public void deleteNote(@PathVariable Long noteId) {
    if (!webSecurity.isValidUser()) {
      throw new NoSuchUserProblem();
    }

    noteService.deleteNote(noteId);
  }
}
