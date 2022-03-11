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
