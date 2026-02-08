import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DrawerModule } from "primeng/drawer";
import { RadioButtonModule } from "primeng/radiobutton";
import { ButtonModule } from "primeng/button";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { AppConfigComponent } from "./app.config.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        DrawerModule,
        RadioButtonModule,
        ButtonModule,
        ToggleSwitchModule,
        AppConfigComponent,
    ],
    exports: [AppConfigComponent],
})
export class AppConfigModule {}
