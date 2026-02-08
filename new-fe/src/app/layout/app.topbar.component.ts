import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MenuItem } from "primeng/api";
import { LayoutService } from "./service/app.layout.service";
import { Menu } from "primeng/menu";
import { ThemeService } from "../services/theme.service";
import { AuthService } from "../services/auth.service";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { MenuModule } from "primeng/menu";
import { ButtonModule } from "primeng/button";
import { NotificationComponent } from "../notifications/notification.component";

@Component({
    selector: "app-topbar",
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MenuModule,
        ButtonModule,
        NotificationComponent,
    ],
    templateUrl: "./app.topbar.component.html",
})
export class AppTopBarComponent implements OnInit {
    items!: MenuItem[];
    toggleOptionsMenu: boolean = false;
    options: MenuItem[] = [];

    private themes = [
        {
            id: "dark-theme",
        },
        {
            id: "light-theme",
        },
    ];

    @ViewChild("menubutton") menuButton!: ElementRef;

    @ViewChild("topbarmenubutton") topbarMenuButton!: ElementRef;

    @ViewChild("topbarmenu") tobBarMenu!: ElementRef;

    @ViewChild("menu") settingsMenu!: Menu;

    constructor(
        public layoutService: LayoutService,
        public themeService: ThemeService,
        private authService: AuthService,
        private router: Router,
    ) {}

    ngOnInit() {
        this.options = this.buildSettingsOptions();
    }

    onSettingsIconClicked(event: Event) {
        this.settingsMenu.toggle(event);
    }

    private buildSettingsOptions() {
        return [
            {
                label: "Profile",
                items: [
                    {
                        label: "Logout",
                        icon: "pi pi-sign-out",
                        command: () => this.logout(),
                    },
                ],
            },
            {
                label: "Theme",
                items: [
                    {
                        label: "Light",
                        icon: "pi pi-sun",
                        command: () => this.toggleLightTheme(),
                    },
                    {
                        label: "Dark",
                        icon: "pi pi-moon",
                        command: () => this.toggleDarkTheme(),
                    },
                ],
            },
        ];
    }

    private toggleLightTheme(): void {
        this.themeService.switchTheme(this.themes[1].id);
        this.layoutService.config.set({
            ...this.layoutService.config(),
            colorScheme: "light",
        });
    }

    private toggleDarkTheme(): void {
        this.themeService.switchTheme(this.themes[0].id);
        this.layoutService.config.set({
            ...this.layoutService.config(),
            colorScheme: "dark",
        });
    }

    private logout(): void {
        this.authService.logout();
        this.router.navigate(["/login"]);
    }
}
