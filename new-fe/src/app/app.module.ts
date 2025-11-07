import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";

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
import { ApiModule } from "src/typescript-api-client/src/api.module";
import { environment } from "src/environments/environment";
import { GiftNotificationComponent } from "./components/gift-notification/gift-notification.component";
import { SharedComponentsModule } from "./shared/components.module";
import { MessageService } from "primeng/api";

export function tokenGetter() {
    return localStorage.getItem("id_token");
}

@NgModule({
    declarations: [AppComponent, GiftNotificationComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        AppLayoutModule,
        SharedComponentsModule,
        ApiModule.forRoot(() => new Configuration({
            basePath: environment.apiUrl,
            withCredentials: true,
            accessToken: () => localStorage.getItem("id_token") || ''
        })),
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
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        AuthService,
        AuthGuard,
        MessageService
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
