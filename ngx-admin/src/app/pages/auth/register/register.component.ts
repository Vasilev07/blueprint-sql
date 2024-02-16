import { Component } from '@angular/core';
import { NbRegisterComponent } from '@nebular/auth';

@Component({
  selector: 'ngx-register',
  templateUrl: './register.component.html',
})
export class NgxRegisterComponent extends NbRegisterComponent {
    register() {
        console.log('Form Data: ', this.user);
    }
    //create me login method which gets the data from ngForm and sends it to the server
}