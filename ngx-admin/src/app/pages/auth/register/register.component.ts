import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthService, NbRegisterComponent } from '@nebular/auth';

@Component({
    selector: 'ngx-register',
    templateUrl: './register.component.html',
})
export class NgxRegisterComponent extends NbRegisterComponent {
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

    register() {
        this.http.get('http://localhost:3000/').subscribe((res) => {
            console.log('Response: ', res);
        });
        this.http.post('http://localhost:3000/auth/register', this.user).subscribe((res) => {
            console.log('Response: ', res);
        });
    }
    //create me login method which gets the data from ngForm and sends it to the server
}
