import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';



@Component({
  selector: 'app-agbutton',
  templateUrl: './agbutton.component.html',
  styleUrls: ['./agbutton.component.scss']
})
export class AgbuttonComponent  implements ICellRendererAngularComp {
  filed:any;
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    this.params = params;
      return true;
  }

  params: any;

  agInit(params: any): void {
    this.params = params;
    this.filed = this.getValueToDisplay(params);
  }

  btnClickedHandler() {
    this.params.clicked(this.params);
  }

  getValueToDisplay(params: any) {
    return params;
}
  
}
