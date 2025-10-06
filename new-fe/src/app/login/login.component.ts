import { Component } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { AuthService } from "../services/auth.service";

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
    styles: [
        `
            :host ::ng-deep .pi-eye,
            :host ::ng-deep .pi-eye-slash {
                transform: scale(1.6);
                margin-right: 1rem;
                color: var(--primary-color) !important;
            }
        `,
    ],
})
export class LoginComponent {
    valCheck: string[] = ["remember"];

    username!: string;
    password!: string;

    constructor(
        public layoutService: LayoutService,
        private authService: AuthService,
    ) {}

    public login(): void {
        if (this.username && this.password) {
            this.authService.login(this.username, this.password);
        }
    }
}
