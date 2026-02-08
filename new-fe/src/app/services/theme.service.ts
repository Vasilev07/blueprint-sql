import { Inject, Injectable } from "@angular/core";
import { DOCUMENT } from "@angular/common";

const THEME_STORAGE_KEY = "app-theme";
const DARK_CLASS = "app-dark";

@Injectable({
    providedIn: "root",
})
export class ThemeService {
    constructor(@Inject(DOCUMENT) private document: Document) {}

    /** Apply stored theme (e.g. on app init). Call from AppComponent or layout. */
    applyStoredTheme(): void {
        const stored = this.getStoredTheme();
        this.switchTheme(stored);
    }

    getStoredTheme(): string {
        if (typeof this.document.defaultView?.localStorage === "undefined") {
            return "dark-theme";
        }
        return (
            this.document.defaultView.localStorage.getItem(THEME_STORAGE_KEY) ??
            "dark-theme"
        );
    }

    switchTheme(theme: string): void {
        const isDark = theme === "dark-theme";
        const root = this.document.documentElement;
        if (!root) return;

        if (isDark) {
            root.classList.add(DARK_CLASS);
        } else {
            root.classList.remove(DARK_CLASS);
        }

        if (this.document.defaultView?.localStorage) {
            this.document.defaultView.localStorage.setItem(
                THEME_STORAGE_KEY,
                theme,
            );
        }
    }
}
