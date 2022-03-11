import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {Md5} from 'ts-md5';

@Component({
  selector: 'app-gravatar',
  templateUrl: './gravatar.component.html',
  styleUrls: ['./gravatar.component.css']
})
export class GravatarComponent implements OnInit {

  @Input() email: string|undefined;
  @Input() alt: string|undefined;
  @Input() s = '';

  // @ts-ignore
  @ViewChild('avatar', { static: false }) set userContent(avatarDiv: ElementRef<HTMLDivElement>) {
    if (avatarDiv) {
      if (this.email) {
        avatarDiv.nativeElement.style.backgroundColor = this.getColourForEmail(this.email);
      } else {
        avatarDiv.nativeElement.style.backgroundColor = this.getRandomColour();
      }
    }
  }

  public gravatar = false;
  public src = '';
  private param = '';
  public style = '';

  constructor() { }

  ngOnInit(): void {
    if (this.s !== '') {
      this.style = `font-size:${this.s};`;
    }
    if (this.alt || this.alt === '') {
      this.param = 'd=404';
    } else {
      this.param = 'd=identicon';
      this.alt = this.email;
    }
    this.updateGravatar(this.email);
  }

  getRandomColour(): string {
      return 'hsl(' + 360 * Math.random() + ',' +
                 (100 * Math.random()) + '%,' +
                 (10 + 35 * Math.random()) + '%)';
  }

  getColourForEmail(email: string | undefined): string {
    if (email) {
      let hash = this.hashCode(email);
      const H = Math.abs(hash % 359);
      hash = Math.ceil(hash / 360);
      const S = Math.abs(hash % 100);
      hash = Math.ceil(hash / 100);
      const L = 10 + Math.abs(hash % 35);
      return 'hsl(' + H + ',' +
                      S + '%,' +
                      L + '%)';
    }
    return this.getRandomColour();
}
  hashCode(s: string): number {
    let h = 0;
    const l = s.length;
    let i = 0;
    if ( l > 0 ) {
      while (i < l) {
        h = (h << 5) - h + s.charCodeAt(i++) | 0;
      }
    }
    return h;
  }

  handleError(): void {
    this.gravatar = false;
  }

  updateGravatar(email?: string): void {
    if (!email) {
      this.gravatar = false;
      return;
    } else {
      this.gravatar = true;
    }
    const emailHash = Md5.hashStr(email.trim().toLowerCase());
    this.src = `//www.gravatar.com/avatar/${emailHash}?${this.param}`;
  }

}
