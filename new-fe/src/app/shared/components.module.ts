import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";

// PrimeNG Modules
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import { AvatarModule } from "primeng/avatar";
import { DialogModule } from "primeng/dialog";
import { InputTextareaModule } from "primeng/inputtextarea";
import { MessagesModule } from "primeng/messages";
import { MessageModule } from "primeng/message";

// Shared Components
import { UserCardComponent } from "../home/user-card/user-card.component";
import { SendGiftDialogComponent } from "./send-gift-dialog/send-gift-dialog.component";

@NgModule({
    declarations: [UserCardComponent, SendGiftDialogComponent],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        TooltipModule,
        AvatarModule,
        DialogModule,
        InputTextareaModule,
        MessagesModule,
        MessageModule,
    ],
    exports: [UserCardComponent, SendGiftDialogComponent],
})
export class SharedComponentsModule {}

