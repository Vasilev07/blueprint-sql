import { NgModule } from "@angular/core";
import { UsersComponent } from "./users.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UsersRoutingModule } from "./users-routing.module";
import { ThemeModule } from "../../@theme/theme.module";
import { TablesModule } from "../tables/tables.module";

@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        ThemeModule,
        FormsModule,
        CommonModule,
        TablesModule,
        UsersRoutingModule,
    ],
    declarations: [
        UsersComponent
    ]
})
export class UsersModule {
}
