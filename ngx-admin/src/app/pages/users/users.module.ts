import { NgModule } from "@angular/core";
import { UsersComponent } from "./users.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { TablesModule } from "../tables/tables.module";
import { routing } from "./users-routing.module";
import { RouterModule } from "@angular/router";
import { ThemeModule } from "../../@theme/theme.module";

@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        ThemeModule,
        FormsModule,
        CommonModule,
        TablesModule,
        RouterModule,
        routing
    ],
    declarations: [
        UsersComponent
    ]
})
export class UsersModule {
    constructor() {
        console.log('users module');
    }
}