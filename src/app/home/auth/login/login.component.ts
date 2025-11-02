import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotifierService } from 'angular-notifier';
import { loginModel } from '../../../models/Users';
import { ApiService } from '../../../Services/api.service';
import { PersistenceService } from '../../../Services/persistence.service';
import { UsersModel } from '../../../models/Users';
import { RxwebValidators } from '@rxweb/reactive-form-validators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
 // providers: [FormBuilder],
})
export class LoginComponent {

  users !: UsersModel;
  formgroup :FormGroup = this.fb.group({
    userId: ['' ,[ RxwebValidators.required({ message: 'Employee Id / Email is required' })],],
    //email: ['' , RxwebValidators.required({ message: 'Employee Id / Email is required' }),],
    password: ['' , RxwebValidators.required({ message: 'Password is required' }),],
  });

  constructor(private fb: FormBuilder, public apiService: ApiService,
     private notifier:NotifierService, private router: Router, private persistance: PersistenceService){

      if(this.persistance.getUserUID() != null){
        this.persistance.logout();
      }
  }


  onSubmit() {
    if (this.formgroup.valid) {
      var login: loginModel = { ...this.formgroup.value };
      login.email = login.userId;
      this.apiService.login(login).subscribe(
        (user: any) => {
          if (user) {
            console.log('Login successful, user data:', user);
            this.persistance.setSessionStorage('currentUser', user);
            this.notifier.notify('success', 'Login Successfully');
            this.formgroup.reset();
            
            // Give a small delay to ensure session storage is set before navigation
            setTimeout(() => {
              this.router.navigate(['/home']).then((navigationSuccess) => {
                console.log('Navigation result:', navigationSuccess);
                if (navigationSuccess) {
                  location.reload();
                }
              });
            }, 100);
          } else {
            this.notifier.notify('error', 'Invalid login response');
          }
        },
        (error) => {
          console.error('Login error:', error);
          this.notifier.notify('error', 'Something went wrong during login');
        }
      );
    } else {
      console.log('Form is invalid');
      this.notifier.notify('error', 'Please fill in all required fields');
    }
  }
}
