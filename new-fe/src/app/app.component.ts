import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { PrimeNG } from "primeng/config";
import { AppConfig, LayoutService } from "./layout/service/app.layout.service";
import { ThemeService } from "./services/theme.service";
import { GiftNotificationComponent } from "./components/gift-notification/gift-notification.component";
import { SuperLikeNotificationComponent } from "./components/super-like-notification/super-like-notification.component";
import { IncomingCallComponent } from "./components/incoming-call/incoming-call.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        RouterOutlet,
        GiftNotificationComponent,
        SuperLikeNotificationComponent,
        IncomingCallComponent,
    ],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
    title = "new-fe";

    constructor(
        private primengConfig: PrimeNG,
        private layoutService: LayoutService,
        private themeService: ThemeService,
    ) {}

    ngOnInit(): void {
        this.themeService.applyStoredTheme();
        const storedTheme = this.themeService.getStoredTheme();
        const colorScheme = storedTheme === "dark-theme" ? "dark" : "light";

        const config: AppConfig = {
            ripple: false,
            inputStyle: "outlined",
            menuMode: "static",
            colorScheme,
            theme: "lara-dark-indigo",
            scale: 14,
        };
        this.layoutService.config.set(config);
    }
}
