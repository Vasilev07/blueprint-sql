import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { InputTextModule } from "primeng/inputtext";
import { DrawerModule } from "primeng/drawer";
import { BadgeModule } from "primeng/badge";
import { RadioButtonModule } from "primeng/radiobutton";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { RippleModule } from "primeng/ripple";
import { AppMenuComponent } from "./app.menu.component";
import { AppMenuitemComponent } from "./app.menuitem.component";
import { RouterModule } from "@angular/router";
import { AppTopBarComponent } from "./app.topbar.component";
import { AppFooterComponent } from "./app.footer.component";
import { AppConfigModule } from "./config/config.module";
import { AppSidebarComponent } from "./app.sidebar.component";
import { AppLayoutComponent } from "./app.layout.component";
import { MenuModule } from "primeng/menu";
import { ButtonModule } from "primeng/button";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { NotificationsModule } from "../notifications/notifications.module";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        InputTextModule,
        DrawerModule,
        BadgeModule,
        RadioButtonModule,
        ToggleSwitchModule,
        RippleModule,
        RouterModule,
        AppConfigModule,
        MenuModule,
        ButtonModule,
        ToastModule,
        ConfirmDialogModule,
        NotificationsModule,
        AppMenuitemComponent,
        AppTopBarComponent,
        AppFooterComponent,
        AppMenuComponent,
        AppSidebarComponent,
        AppLayoutComponent,
    ],
    exports: [AppLayoutComponent],
})
export class AppLayoutModule {}
