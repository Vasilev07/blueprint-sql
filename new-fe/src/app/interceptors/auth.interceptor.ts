import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        // Get the auth token from localStorage
        const authToken = localStorage.getItem('id_token');

        // Clone the request and add the authorization header if token exists
        if (authToken) {
            const authReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${authToken}`),
            });
            return next.handle(authReq);
        }

        // If no token, proceed with the original request
        return next.handle(req);
    }
}

