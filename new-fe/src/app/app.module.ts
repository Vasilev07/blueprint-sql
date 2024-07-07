import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppLayoutModule } from "./layout/app.layout.module";
import { AuthService } from "./services/auth.service";
import { JwtModule } from "@auth0/angular-jwt";
import { AuthGuard } from "./services/auth.guard";

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
                allowedDomains: ["example.com"],
                disallowedRoutes: ["http://example.com/examplebadroute/"],
            },
        }),
    ],
    providers: [AuthService, AuthGuard],
    bootstrap: [AppComponent],
})
export class AppModule {}
