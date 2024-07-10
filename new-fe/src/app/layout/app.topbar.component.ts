import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MenuItem } from "primeng/api";
import { LayoutService } from "./service/app.layout.service";
import { Menu } from "primeng/menu";
import { ThemeService } from "../services/theme.service";

@Component({
    selector: "app-topbar",
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
        console.log("Light theme");
        this.themeService.switchTheme(this.themes[1].id);
    }

    private toggleDarkTheme(): void {
        console.log("Dark theme");
        this.themeService.switchTheme(this.themes[0].id);
    }
}
