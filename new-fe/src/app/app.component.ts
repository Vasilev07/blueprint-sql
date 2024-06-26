import { Component, OnInit } from "@angular/core";
import { PrimeNGConfig } from "primeng/api";
import { AppConfig, LayoutService } from "./layout/service/app.layout.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
    title = "new-fe";

    constructor(
        private primengConfig: PrimeNGConfig,
        private layoutService: LayoutService,
    ) {}

    ngOnInit(): void {
        this.primengConfig.ripple = true; //enables core ripple functionality

        //optional configuration with the default configuration
        const config: AppConfig = {
            ripple: false, //toggles ripple on and off
            inputStyle: "outlined", //default style for input elements
            menuMode: "static", //layout mode of the menu, valid values are "static" and "overlay"
            colorScheme: "light", //color scheme of the template, valid values are "light" and "dark"
            theme: "lara-light-indigo", //default component theme for PrimeNG
            scale: 14, //size of the body font size to scale the whole application
        };
        this.layoutService.config.set(config);
    }
}
