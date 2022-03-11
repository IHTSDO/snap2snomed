import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'trim'})
export class TrimPipe implements PipeTransform {
  transform(namefield: string | undefined): string | undefined {
    const maxwidth = (window.innerWidth <= 1000) ? 20 : (window.innerWidth <= 2000) ? 40 : 60;
    if (namefield && namefield.length > maxwidth) {
      return namefield.substr(0, maxwidth) + '...';
    }
    return namefield;
  }
}
