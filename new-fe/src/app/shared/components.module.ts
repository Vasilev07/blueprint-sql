import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";

// PrimeNG Modules
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import { AvatarModule } from "primeng/avatar";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { MessageModule } from "primeng/message";
import { RippleModule } from "primeng/ripple";
import { ToastModule } from "primeng/toast";

// Shared Components
import { UserCardComponent } from "../home/user-card/user-card.component";
import { SendGiftDialogComponent } from "./send-gift-dialog/send-gift-dialog.component";
import { IncomingCallComponent } from "../components/incoming-call/incoming-call.component";

@NgModule({
    imports: [
        CommonModule,
        SendGiftDialogComponent,
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        TooltipModule,
        AvatarModule,
        DialogModule,
        TextareaModule,
        MessageModule,
        RippleModule,
        ToastModule,
        UserCardComponent,
        IncomingCallComponent,
    ],
    exports: [
        UserCardComponent, 
        SendGiftDialogComponent, 
        IncomingCallComponent
    ],
})
export class SharedComponentsModule {}

