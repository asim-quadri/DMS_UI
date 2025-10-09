import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Component } from '@angular/core';

@Component({
  selector: 'app-ag-delete-button',
  templateUrl: './ag-delete-button.component.html',
  styleUrls: ['./ag-delete-button.component.scss']
})
export class AgDeleteButtonComponent implements ICellRendererAngularComp{

  private params: any;
  filed:any;
  agInit(params: any): void {
    this.params = params;
    this.filed = this.getValueToDisplay(params);
  }

  btnClickedHandler(params: any) {
    this.params.clicked(this.params);
  }



  // gets called whenever the cell refreshes
  refresh(params: any): boolean {
      // set value into cell again
      this.params = this.getValueToDisplay(params);
      this.filed = this.getValueToDisplay(params);
      return true;
  }


  getValueToDisplay(params: any) {
      return params.valueFormatted ? params.valueFormatted : params.value;
  }
}
