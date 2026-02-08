import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { PopoverModule } from "primeng/popover";
import { AvatarModule } from "primeng/avatar";
import { TooltipModule } from "primeng/tooltip";
import { NotificationComponent } from "./notification.component";

@NgModule({
    imports: [
        CommonModule,
        ButtonModule,
        PopoverModule,
        AvatarModule,
        TooltipModule,
        NotificationComponent,
    ],
    exports: [NotificationComponent],
})
export class NotificationsModule {}
