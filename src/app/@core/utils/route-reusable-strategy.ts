import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class RouteReusableStrategy extends RouteReuseStrategy {
  public shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  public store(
    route: ActivatedRouteSnapshot,
    detachedTree: DetachedRouteHandle | null
  ): void { }

  public shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  public shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    // Reuse the route if the RouteConfig is the same, or if both routes use the
    // same component, because the latter can have different RouteConfigs.
    return (
      future.routeConfig === curr.routeConfig ||
      Boolean(
        future.routeConfig?.component &&
        future.routeConfig?.component === curr.routeConfig?.component
      )
    );
  }
}
