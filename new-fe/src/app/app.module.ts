import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HTTP_INTERCEPTORS } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppLayoutModule } from "./layout/app.layout.module";
import { AuthService } from "./services/auth.service";
import { JwtModule } from "@auth0/angular-jwt";
import { AuthGuard } from "./services/auth.guard";
import { AuthInterceptor } from "./interceptors/auth.interceptor";
import { BASE_PATH } from "src/typescript-api-client/src/variables";
import { Configuration } from "src/typescript-api-client/src";
import { environment } from "src/environments/environment";

export function tokenGetter() {
    return localStorage.getItem("id_token");
}

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        AppLayoutModule,
        JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter,
                allowedDomains: ["localhost:3000", "api.impulseapp.net"],
                disallowedRoutes: [],
            },
        }),
    ],
    providers: [
        {
            provide: Configuration,
            useFactory: () => new Configuration({
              basePath: environment.apiUrl, // Dynamically sets basePath to environment.apiUrl
              // Optional: Add other config options like credentials, headers, etc.
              withCredentials: true, // Example for CORS with credentials
              accessToken: () => {
                const token = localStorage.getItem("id_token");
                return token || '';
              }
            }),
            multi: false, // Not multi-provider
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        AuthService,
        AuthGuard
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
