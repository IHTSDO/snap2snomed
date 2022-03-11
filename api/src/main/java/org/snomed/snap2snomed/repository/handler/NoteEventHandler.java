package org.snomed.snap2snomed.repository.handler;

import org.snomed.snap2snomed.model.MapRow;
import org.snomed.snap2snomed.model.Note;
import org.snomed.snap2snomed.problem.BadRequestDataProblem;
import org.snomed.snap2snomed.problem.auth.MissingJwtProblem;
import org.snomed.snap2snomed.problem.auth.MissingJwtSubjectProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.snomed.snap2snomed.repository.UserRepository;
import org.snomed.snap2snomed.security.AuthenticationFacade;
import org.snomed.snap2snomed.security.WebSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkDelete;
import org.springframework.data.rest.core.annotation.HandleBeforeLinkSave;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

@RepositoryEventHandler
public class NoteEventHandler {

  @Autowired
  UserRepository userRepository;

  @Autowired
  AuthenticationFacade authenticationFacade;

  @Autowired
  WebSecurity webSecurity;

  @HandleBeforeCreate
  public void handleNoteBeforeCreate(Note note)
      throws MissingJwtSubjectProblem, MissingJwtProblem {

    if (note.getMapRow() == null || note.getMapRow().getMap() == null || note.getMapRow().getMap().getId() == null) {
      throw new BadRequestDataProblem("A note must be associated to a map via a map row");
    }

    if (!webSecurity.hasAnyProjectRoleForMapId(note.getMapRow().getMap().getId())) {
      throw new NotAuthorisedProblem("Only a user with a project role can add notes");
    }

    note.setNoteBy(authenticationFacade.getAuthenticatedUser());
  }

  @HandleBeforeSave
  public void handleNoteBeforeSave(Note note)
      throws MissingJwtSubjectProblem, MissingJwtProblem {
    if (!note.getNoteBy().equals(authenticationFacade.getAuthenticatedUser())) {
      throw new NotAuthorisedProblem("Only the original author can update a note");
    }
    note.setNoteBy(authenticationFacade.getAuthenticatedUser());
  }

  @HandleBeforeLinkSave
  public void handleBeforeLinkSave(Note note) {
    throw new NotAuthorisedProblem("Note links cannot be modified");
  }

  @HandleBeforeLinkDelete
  public void handleBeforeLinkDelete(Note note) {
    throw new NotAuthorisedProblem("Note links cannot be modified");
  }

}
