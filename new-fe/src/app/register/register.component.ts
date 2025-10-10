import { Component } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";
import { UserDTO } from "src/typescript-api-client/src";
import { MessageService } from "primeng/api";

@Component({
    selector: "app-register",
    templateUrl: "./register.component.html",
    providers: [MessageService],
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
export class RegisterComponent {
    email: string = "";
    password: string = "";
    confirmPassword: string = "";
    fullName: string = "";
    gender: string = "";
    city: string = "";
    
    emailExists: boolean = false;
    emailChecked: boolean = false;

    genderOptions = [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
    ];

    constructor(
        public layoutService: LayoutService,
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService
    ) {}

    public checkEmail(): void {
        if (this.email && this.email.includes("@")) {
            this.authService.checkEmailExists(this.email).subscribe(
                (exists) => {
                    this.emailExists = exists;
                    this.emailChecked = true;
                    if (exists) {
                        this.messageService.add({
                            severity: "error",
                            summary: "Error",
                            detail: "This email is already registered",
                        });
                    }
                },
                (error) => {
                    console.error("Error checking email:", error);
                }
            );
        }
    }

    public register(): void {
        // Validation
        if (!this.email || !this.password || !this.confirmPassword || !this.fullName) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Please fill in all required fields",
            });
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Passwords do not match",
            });
            return;
        }

        if (this.emailExists) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "This email is already registered",
            });
            return;
        }

        const userDTO: UserDTO = {
            email: this.email,
            password: this.password,
            confirmPassword: this.confirmPassword,
            fullName: this.fullName,
            gender: this.gender as UserDTO.GenderEnum,
            city: this.city,
        };

        this.authService.register(userDTO).subscribe(
            (res) => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Registration successful! Please login.",
                });
                setTimeout(() => {
                    this.router.navigate(["/login"]);
                }, 2000);
            },
            (error) => {
                console.error("Registration error:", error);
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: error.error?.message || "Registration failed. Please try again.",
                });
            }
        );
    }

    public navigateToLogin(): void {
        this.router.navigate(["/login"]);
    }
}

