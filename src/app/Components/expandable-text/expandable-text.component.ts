import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-expandable-text',
  templateUrl: './expandable-text.component.html',
  styleUrls: ['./expandable-text.component.scss']
})
export class ExpandableTextComponent implements AfterViewInit {

  @Input() text: string = '';
  @Input() maxLines: number = 2;
  @ViewChild('textElement', { static: false }) textElement!: ElementRef;
  
  showFull: boolean = false;
  isTextOverflowing: boolean = false;

  ngAfterViewInit() {
    this.checkTextOverflow();
  }

  checkTextOverflow() {
    if (this.textElement) {
      const element = this.textElement.nativeElement;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * this.maxLines;
      this.isTextOverflowing = element.scrollHeight > maxHeight;
    }
  }

  toggle() {
    this.showFull = !this.showFull;
  }

}
