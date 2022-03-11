import {IAppState} from './app.state';
import {createSelector} from '@ngrx/store';

const selectState = (state: IAppState) => state;

export const selectOwnedProjects = createSelector(
  selectState,
  (state: IAppState) => {
    const id = (state.auth.isAuthenticated && state.auth.currentuser) ? state.auth.currentuser.id : '';
    // @ts-ignore
    return state.mapping.projects.filter((project) => project.owners.filter((owner) => owner.id === id).length > 0);
  }
);

export const selectAuthorizedProjects = createSelector(
  selectState,
  (state: IAppState) => {
    const id = (state.auth.isAuthenticated && state.auth.currentuser) ? state.auth.currentuser.id : '';
    return state.mapping.projects.filter((project) => {
      const ownedProjects = project.owners.filter((user) => user.id === id).length;
      const memberProjects = project.members.filter((user) => user.id === id).length;
      const guestProjects = project.guests.filter((user) => user.id === id).length;
      return (ownedProjects + memberProjects + guestProjects) > 0;
    });
  }
);

export const selectAssignedTasks = createSelector(
  selectState,
  (state: IAppState) => {
    const id = (state.auth.isAuthenticated && state.auth.currentuser) ? state.auth.currentuser.id : '';
    return state.task.tasks.filter((task) => task.assignee.id === id);
  }
);
