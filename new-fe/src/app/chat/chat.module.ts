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
import { InputTextareaModule } from "primeng/inputtextarea";
import { DropdownModule } from "primeng/dropdown";
import { CalendarModule } from "primeng/calendar";

import { ChatHomeComponent } from "./chat-home.component";
import { ChatComponent } from "./chat.component";
import { ChatListComponent } from "./chat-list.component";
import { ChatMessageComponent } from "./chat-message.component";
import { UserListComponent } from "./user-list.component";
import { FriendsListComponent } from "./friends-list.component";
import { RecentMessagesComponent } from "./recent-messages.component";
import { ChatService } from "./chat.service";

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
    declarations: [
        ChatHomeComponent,
        ChatComponent,
        ChatListComponent,
        ChatMessageComponent,
        UserListComponent,
        FriendsListComponent,
        RecentMessagesComponent,
    ],
    imports: [
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
        InputTextareaModule,
        DropdownModule,
        CalendarModule,
        HttpClientModule,
    ],
    providers: [ChatService],
})
export class ChatModule {
}
