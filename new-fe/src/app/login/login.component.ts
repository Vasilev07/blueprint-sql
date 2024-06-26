import { Component } from "@angular/core";
import { HttpClient } from "@angular/common/http";

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

    constructor(private readonly http: HttpClient) {}

    login(email: string, password: string) {
        console.log(email, password);
        return this.http
            .post("localhost:3000/auth/login", { email, password })
            .subscribe((res) => {
                console.log(res);
            });
        // this is just the HTTP call,
        // we still need to handle the reception of the token
    }
}
