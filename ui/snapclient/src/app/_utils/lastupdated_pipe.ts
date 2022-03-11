import {Pipe, PipeTransform} from '@angular/core';

const min = 1000 * 60;

@Pipe({name: 'lastupdated'})
export class LastupdatedPipe implements PipeTransform {
  transform(datefield?: Date | null): string | null {
    if (!datefield) {
      return datefield ?? null;
    }
    const today = new Date();
    const diff = Math.floor(today.getTime() - new Date(datefield).getTime());
    const mins = Math.floor(diff / min);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 31);
    const years = Math.floor(days / 365.25);

    let interval = [];
    if (days == 0) {
      if (hours > 0) {
        interval.push(hours%24 + ' hours');
      }
      if (mins > 0) {
        interval.push(mins%60 + ' minutes');
      }
    } else if (years == 0) {
      interval.push(days%31 + ' days');
    }
    if (months > 0) {
      interval.push(months%12 + ' months');
    }
    if (years > 0) {
      interval.push(years + ' years');
    }
    interval = interval.slice(-2);
    if (interval.length) {
      return interval.join(', ') + ' ago';
    } else {
      return 'just now'
    }

  }
}
