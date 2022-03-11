import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {Match} from 'src/app/store/fhir-feature/fhir.reducer';
import {SelectionService} from 'src/app/_services/selection.service';

@Component({
  selector: 'app-concept-list',
  templateUrl: './concept-list.component.html',
  styleUrls: ['./concept-list.component.css']
})
export class ConceptListComponent implements OnInit, OnDestroy {

  @Input() items: Match[] = [];

  private subscription = new Subscription();
  displayedColumns = [
    'label',
    'tag',
  ];

  selected?: number;

  constructor(
    private selectionService: SelectionService,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.selectionService.subscribe({
        next: (_value: any) => {
          this.selected = undefined;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  click(value: number): void {
    if (this.selected === value) {
      this.selectionService.select(null);
      this.selected = undefined;
    } else {
      const concept = this.items[value];
      this.selectionService.select(concept);
      this.selected = value;
    }
  }

}
