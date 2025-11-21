import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-toc-review',
  templateUrl: './toc-review.component.html',
  styleUrls: ['./toc-review.component.scss']
})
export class TocReviewComponent {
  active: number =1;
  @Input()
  ruleType: string | undefined;
}
