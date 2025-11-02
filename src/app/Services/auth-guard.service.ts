import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PersistenceService } from './persistence.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(private persistance: PersistenceService, private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<boolean> | Promise<boolean> | UrlTree | boolean {
    
    // Check if user is logged in by verifying session storage
    const currentUser = sessionStorage.getItem("currentUser");
    const userUID = this.persistance.getUserUID();
    if (currentUser && currentUser !== '{}' && userUID) {
      
      return true;
    }
    
    
    // Redirect to login if not authenticated
    this.router.navigate(['/login']);
    return false;
  }
}
