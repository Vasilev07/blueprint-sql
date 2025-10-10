import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RegisterRoutingModule } from "./register-routing.module";
import { RegisterComponent } from "./register.component";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { PasswordModule } from "primeng/password";
import { InputTextModule } from "primeng/inputtext";
import { DropdownModule } from "primeng/dropdown";
import { ToastModule } from "primeng/toast";

@NgModule({
    imports: [
        CommonModule,
        RegisterRoutingModule,
        ButtonModule,
        InputTextModule,
        FormsModule,
        PasswordModule,
        DropdownModule,
        ToastModule,
    ],
    declarations: [RegisterComponent],
})
export class RegisterModule {}

