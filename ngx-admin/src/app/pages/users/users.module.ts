import { NgModule } from "@angular/core";
import { UsersComponent } from "./users.component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { TablesModule } from "../tables/tables.module";
import { routing } from "./users-routing.module";

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        TablesModule,
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