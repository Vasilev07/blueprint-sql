import { Component, Input } from '@angular/core';
import { NbLoginComponent } from '@nebular/auth';

@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
})
export class NgxLoginComponent extends NbLoginComponent {
    login() {
        console.log('Form Data: ', this.user);
    }
    //create me login method which gets the data from ngForm and sends it to the server
}