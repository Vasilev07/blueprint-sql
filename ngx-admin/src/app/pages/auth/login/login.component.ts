import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthService, NbLoginComponent } from '@nebular/auth';

@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
})
export class NgxLoginComponent extends NbLoginComponent {
    errors: string[] = [];
    showMessages: any = {
        error: true
    };

    constructor(private readonly http: HttpClient,
                private readonly nbAuthService: NbAuthService,
                private readonly cdr: ChangeDetectorRef,
                public readonly router: Router) {
        super(nbAuthService, {}, cdr, router);
    }

    login() {
        this.http.post('http://localhost:3001/login', this.user).subscribe((res) => {
            console.log('Response: ', res);
        });
    }
}