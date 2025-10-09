import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Component } from '@angular/core';



@Component({
  selector: 'app-agbutton',
  templateUrl: './agbutton.component.html',
  styleUrls: ['./agbutton.component.scss']
})
export class AgbuttonComponent  implements ICellRendererAngularComp {
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    this.params = params;
       return true;
  }
  filed:any;

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
