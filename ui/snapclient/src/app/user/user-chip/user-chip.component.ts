import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {User} from '../../_models/user';

@Component({
  selector: 'app-user-chip',
  templateUrl: './user-chip.component.html',
  styleUrls: ['./user-chip.component.css']
})
export class UserChipComponent implements OnInit {
  @Input() user: User = new User();
  @Input() role = '';
  @Input() font_size = '';

  public gravatar = true;

  constructor() { }

  ngOnInit(): void {
  }

}
