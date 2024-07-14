import { Inject, Injectable } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Injectable({
    providedIn: "root",
})
export class ThemeService {
    constructor(@Inject(DOCUMENT) private document: Document) {}

    switchTheme(theme: string) {
        const themeLink = this.document.getElementById(
            "app-theme",
        ) as HTMLLinkElement;

        console.log(this.document);

        if (themeLink) {
            themeLink.href = theme + ".css";
        }
    }
}
