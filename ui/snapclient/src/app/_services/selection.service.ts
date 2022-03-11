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

import { Injectable } from '@angular/core';
import {Observable, Observer, PartialObserver, Subscription} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {

  private observers: Observer<any>[] = [];

  private selection: any = null;
  private observable: Observable<any>;

  constructor() {
    const self = this;

    this.observable = new Observable((observer) => {
      self.observers.push(observer);

      return {
        unsubscribe() {
          self.observers.splice(self.observers.indexOf(observer), 1);
        }
      };
    });
  }

  public select(thing: any): void {
    if (thing !== this.selection) {
      this.selection = thing;
      this.observers.forEach(obs => obs.next(this.selection));
    }
  }

  public subscribe(subscriber: PartialObserver<any>): Subscription {
    return this.observable.subscribe(subscriber);
  }

  public subscribeWithCurrent(subscriber: PartialObserver<any>): Subscription {
    if (subscriber.next) {
      subscriber.next(this.selection);
    }
    return this.observable.subscribe(subscriber);
  }

}
