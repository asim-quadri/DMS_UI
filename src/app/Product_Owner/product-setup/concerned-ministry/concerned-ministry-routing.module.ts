import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ConcernedMinistryComponent } from "./concerned-ministry/concerned-ministry.component";

const routes: Routes = [
    { path: '', component: ConcernedMinistryComponent }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ConcernedMinistryRoutingModule { }