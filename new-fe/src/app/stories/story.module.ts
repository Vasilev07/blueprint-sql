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
import { MenuModule } from "primeng/menu";
import { DialogModule } from "primeng/dialog";
import { InputTextareaModule } from "primeng/inputtextarea";
import { DropdownModule } from "primeng/dropdown";
import { CalendarModule } from "primeng/calendar";
import { FileUploadModule } from "primeng/fileupload";
import { ProgressBarModule } from "primeng/progressbar";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { SliderModule } from "primeng/slider";
import { CheckboxModule } from "primeng/checkbox";
import { MessageService, ConfirmationService } from "primeng/api";

import { StoryHomeComponent } from "./story-home.component";
import { StoryViewerComponent } from "./story-viewer.component";
import { StoryUploadComponent } from "./story-upload.component";
import { StoryCardComponent } from "./story-card.component";
import { StoryService } from "./story.service";

const routes: Routes = [
    {
        path: "",
        component: StoryHomeComponent,
    },
    {
        path: "upload",
        component: StoryUploadComponent,
    },
    {
        path: "view/:storyId",
        component: StoryViewerComponent,
    },
    {
        path: "test",
        component: StoryHomeComponent,
    },
];

@NgModule({
    declarations: [
        StoryHomeComponent,
        StoryViewerComponent,
        StoryUploadComponent,
        StoryCardComponent,
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
        FileUploadModule,
        ProgressBarModule,
        ToastModule,
        ConfirmDialogModule,
        SliderModule,
        CheckboxModule,
    ],
    providers: [MessageService, ConfirmationService],
})
export class StoryModule {}

