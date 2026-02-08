import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { DividerModule } from "primeng/divider";
import { TooltipModule } from "primeng/tooltip";
import { MenuModule } from "primeng/menu";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { SelectModule } from "primeng/select";
import { DatePickerModule } from "primeng/datepicker";
import { MessageModule } from "primeng/message";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { GiftService } from "src/typescript-api-client/src/api/api";

import { ChatHomeComponent } from "./chat-home.component";
import { ChatComponent } from "./chat.component";
import { ChatListComponent } from "./chat-list.component";
import { ChatMessageComponent } from "./chat-message.component";
import { UserListComponent } from "./user-list.component";
import { FriendsListComponent } from "./friends-list.component";
import { RecentMessagesComponent } from "./recent-messages.component";
import { ChatService } from "./chat.service";
import { SharedComponentsModule } from "../shared/components.module";

const routes: Routes = [
    {
        path: "",
        component: ChatHomeComponent,
    },
    {
        path: "conversation/:userId",
        component: ChatComponent,
    },
];

@NgModule({
    declarations: [],
    imports: [
        ChatHomeComponent,
        ChatComponent,
        ChatListComponent,
        ChatMessageComponent,
        UserListComponent,
        FriendsListComponent,
        RecentMessagesComponent,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        InputTextModule,
        ButtonModule,
        CardModule,
        AvatarModule,
        BadgeModule,
        ScrollPanelModule,
        DividerModule,
        TooltipModule,
        MenuModule,
        DialogModule,
        TextareaModule,
        SelectModule,
        DatePickerModule,
        MessageModule,
        ToastModule,
        HttpClientModule,
        SharedComponentsModule,
    ],
    providers: [ChatService, MessageService, GiftService],
})
export class ChatModule {}
