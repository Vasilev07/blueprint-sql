import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG Modules
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import { AvatarModule } from "primeng/avatar";

// Shared Components
import { UserCardComponent } from "../home/user-card/user-card.component";

@NgModule({
    declarations: [UserCardComponent],
    imports: [
        CommonModule,
        ButtonModule,
        CardModule,
        TooltipModule,
        AvatarModule,
    ],
    exports: [UserCardComponent],
})
export class SharedComponentsModule {}

