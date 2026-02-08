import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { DividerModule } from "primeng/divider";
import { TooltipModule } from "primeng/tooltip";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { SelectModule } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { PanelModule } from "primeng/panel";
import { TagModule } from "primeng/tag";
import { ProgressSpinnerModule } from "primeng/progressspinner";

import { ForumHomeComponent } from "./forum-home.component";
import { RoomDetailComponent } from "./room-detail.component";
import { PostDetailComponent } from "./post-detail.component";
import { WhoVisitedMeComponent } from "./who-visited-me.component";
import { SharedComponentsModule } from "../shared/components.module";
import {
    ForumRoomsService,
    ForumPostsService,
    ForumCommentsService,
    UserService,
} from "../../typescript-api-client/src/api/api";

const routes: Routes = [
    {
        path: "",
        component: ForumHomeComponent,
    },
    {
        path: "who-visited-me",
        component: WhoVisitedMeComponent,
    },
    {
        path: "room/:roomId",
        component: RoomDetailComponent,
    },
    {
        path: "room/:roomId/post/:postId",
        component: PostDetailComponent,
    },
];

@NgModule({
    declarations: [],
    imports: [
        ForumHomeComponent,
        RoomDetailComponent,
        PostDetailComponent,
        WhoVisitedMeComponent,
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
        DialogModule,
        TextareaModule,
        SelectModule,
        ToastModule,
        PanelModule,
        TagModule,
        ProgressSpinnerModule,
        SharedComponentsModule,
    ],
    providers: [MessageService, ForumRoomsService, ForumPostsService, ForumCommentsService, UserService],
})
export class ForumModule {}

