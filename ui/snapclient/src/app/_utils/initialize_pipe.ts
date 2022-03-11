import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'initials'})
export class InitialsPipe implements PipeTransform {
  transform(namefield: string): string {
    if (!namefield) {
      return namefield;
    }
    return namefield[0].toUpperCase();
  }
}
