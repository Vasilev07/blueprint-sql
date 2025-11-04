import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ProfileRoutingModule } from "./profile-routing.module";
import { ProfileComponent } from "./profile.component";
import { TabViewModule } from "primeng/tabview";
import { ButtonModule } from "primeng/button";
import { FileUploadModule } from "primeng/fileupload";
import { CardModule } from "primeng/card";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { InputSwitchModule } from "primeng/inputswitch";
import { InputNumberModule } from "primeng/inputnumber";
import { ChipModule } from "primeng/chip";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { CalendarModule } from "primeng/calendar";
import { MessageModule } from "primeng/message";
import { MessageService, ConfirmationService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import {
    UserService,
    FriendsService,
    GiftService,
} from "src/typescript-api-client/src/api/api";

@NgModule({
    declarations: [ProfileComponent],
    imports: [
        CommonModule,
        FormsModule,
        ProfileRoutingModule,
        TabViewModule,
        ButtonModule,
        FileUploadModule,
        CardModule,
        AvatarModule,
        BadgeModule,
        ProgressSpinnerModule,
        DialogModule,
        DropdownModule,
        InputTextModule,
        InputTextareaModule,
        InputSwitchModule,
        InputNumberModule,
        ChipModule,
        TooltipModule,
        ToastModule,
        DividerModule,
        ConfirmDialogModule,
        CalendarModule,
        MessageModule,
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
