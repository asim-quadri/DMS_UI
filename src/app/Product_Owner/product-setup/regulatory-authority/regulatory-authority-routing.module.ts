import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegulatoryAuthorityComponent } from './regulatory-authority/regulatory-authority.component';

const routes: Routes = [
    { path: '', component: RegulatoryAuthorityComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RegulatoryAuthorityRoutingModule { }