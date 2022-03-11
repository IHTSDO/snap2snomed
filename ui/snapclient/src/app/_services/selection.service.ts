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
