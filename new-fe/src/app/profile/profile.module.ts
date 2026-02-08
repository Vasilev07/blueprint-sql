import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ProfileRoutingModule } from "./profile-routing.module";
import { ProfileComponent } from "./profile.component";
import { TabsModule } from "primeng/tabs";
import { ButtonModule } from "primeng/button";
import { FileUploadModule } from "primeng/fileupload";
import { CardModule } from "primeng/card";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { InputNumberModule } from "primeng/inputnumber";
import { ChipModule } from "primeng/chip";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DatePickerModule } from "primeng/datepicker";
import { MessageModule } from "primeng/message";
import { MessageService, ConfirmationService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import {
    UserService,
    FriendsService,
    GiftService,
} from "src/typescript-api-client/src/api/api";
import { SharedComponentsModule } from "../shared/components.module";

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ProfileRoutingModule,
        TabsModule,
        ButtonModule,
        FileUploadModule,
        CardModule,
        AvatarModule,
        BadgeModule,
        ProgressSpinnerModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        ToggleSwitchModule,
        InputNumberModule,
        ChipModule,
        TooltipModule,
        ToastModule,
        DividerModule,
        ConfirmDialogModule,
        DatePickerModule,
        MessageModule,
        SharedComponentsModule,
        ProfileComponent,
    ],
    providers: [
        MessageService,
        ConfirmationService,
        UserService,
        FriendsService,
        GiftService,
    ],
})
export class ProfileModule {}
