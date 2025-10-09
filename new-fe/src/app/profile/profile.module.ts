import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProfileRoutingModule } from "./profile-routing.module";
import { ProfileComponent } from "./profile.component";
import { TabViewModule } from "primeng/tabview";
import { ButtonModule } from "primeng/button";
import { FileUploadModule } from "primeng/fileupload";
import { CardModule } from "primeng/card";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import {
    UserService,
    FriendsService,
} from "src/typescript-api-client/src/api/api";

@NgModule({
    declarations: [ProfileComponent],
    imports: [
        CommonModule,
        ProfileRoutingModule,
        TabViewModule,
        ButtonModule,
        FileUploadModule,
        CardModule,
        AvatarModule,
        BadgeModule,
        ProgressSpinnerModule,
        ToastModule,
    ],
    providers: [MessageService, UserService, FriendsService],
})
export class ProfileModule {}
