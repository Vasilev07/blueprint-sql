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
import { Configuration } from "src/typescript-api-client/src";
import { ApiModule } from "src/typescript-api-client/src/api.module";
import { environment } from "src/environments/environment";
import { GiftNotificationComponent } from "./components/gift-notification/gift-notification.component";
import { SuperLikeNotificationComponent } from "./components/super-like-notification/super-like-notification.component";
import { SharedComponentsModule } from "./shared/components.module";
import { MessageService } from "primeng/api";
import { providePrimeNG } from "primeng/config";
import { definePreset } from "@primeuix/themes";
import Lara from "@primeuix/themes/lara";

/** Lara preset with indigo primary (matches legacy lara-indigo theme) */
const LaraIndigo = definePreset(Lara, {
    semantic: {
        primary: {
            50: "{indigo.50}",
            100: "{indigo.100}",
            200: "{indigo.200}",
            300: "{indigo.300}",
            400: "{indigo.400}",
            500: "{indigo.500}",
            600: "{indigo.600}",
            700: "{indigo.700}",
            800: "{indigo.800}",
            900: "{indigo.900}",
            950: "{indigo.950}",
        },
    },
});

export function tokenGetter() {
    return localStorage.getItem("id_token");
}

@NgModule({
    declarations: [],
    imports: [
        AppComponent,
        GiftNotificationComponent,
        SuperLikeNotificationComponent,
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        AppLayoutModule,
        SharedComponentsModule,
        ApiModule.forRoot(
            () =>
                new Configuration({
                    basePath: environment.apiUrl,
                    withCredentials: true,
                    accessToken: () => localStorage.getItem("id_token") || "",
                }),
        ),
        JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter,
                allowedDomains: ["localhost:3000", "api.impulseapp.net"],
                disallowedRoutes: [],
            },
        }),
    ],
    providers: [
        providePrimeNG({
            theme: {
                preset: LaraIndigo,
                options: {
                    darkModeSelector: ".app-dark",
                    prefix: "p",
                    cssLayer: false,
                },
            },
            ripple: true,
        }),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        },
        AuthService,
        AuthGuard,
        MessageService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
