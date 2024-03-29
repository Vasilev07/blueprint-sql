import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthJWTToken, NbAuthService, NbLoginComponent } from '@nebular/auth';
import { AuthService } from '../services/auth-service';

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
                public readonly router: Router,
                private readonly authService: AuthService) {
        super(nbAuthService, {}, cdr, router);
        console.log('Login component');

    }

    login() {
        this.http.post('http://0.0.0.0:3001/login', this.user).subscribe((res) => {
            if (res['token'] !== undefined) {
                this.authService.login(new NbAuthJWTToken(res['token'], 'email'));
            }
        });
    }
}
