import { NgModule } from "@angular/core";
import { UsersComponent } from "./users.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UsersRoutingModule } from "./users-routing.module";
import { ThemeModule } from "../../@theme/theme.module";

@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        ThemeModule,
        FormsModule,
        CommonModule,
        UsersRoutingModule
    ],
    declarations: [
        UsersComponent
    ]
})
export class UsersModule {
}