import { Inject, Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NB_AUTH_TOKEN_INTERCEPTOR_FILTER, NbAuthToken } from '@nebular/auth';
import { AuthService } from './auth-service';

@Injectable()
export class JWTInterceptor implements HttpInterceptor {

    constructor(private injector: Injector,
    @Inject(NB_AUTH_TOKEN_INTERCEPTOR_FILTER) protected filter) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log('intercepted request ... ', req);
        // do not intercept request whose urls are filtered by the injected filter
        // if (!this.filter(req)) {
        // if (this.authService.isAuthenticated) {
        return this.authService.getToken().pipe(
            switchMap((token: NbAuthToken) => {
                const JWT = `Bearer ${token.getValue()}`;
                req = req.clone({
                    setHeaders: {
                        Authorization: JWT,
                    },
                });
                return next.handle(req);
            }),
        )
        // }
        // else {
        // Request is sent to server without authentication so that the client code
        // receives the 401/403 error and can act as desired ('session expired', redirect to login, aso)
        // return next.handle(req);
        // }
    // } else {
        // return next.handle(req);
    // }
    }

    protected get authService(): AuthService {
        return this.injector.get(AuthService);
    }

}
