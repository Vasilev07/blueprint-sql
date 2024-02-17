import { NgModule } from "@angular/core";
import { UsersComponent } from "./users.component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { TablesModule } from "../tables/tables.module";

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        TablesModule
    ],
    declarations: [
        UsersComponent
    ],
    exports: [
        UsersComponent
    ]
  })
  export class UsersModule {
  }