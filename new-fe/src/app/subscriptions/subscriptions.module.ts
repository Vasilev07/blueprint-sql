import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SubscriptionsRoutingModule } from "./subscriptions-routing.module";
import { SubscriptionsComponent } from "./subscriptions.component";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        CardModule,
        SubscriptionsRoutingModule,
        SubscriptionsComponent,
    ],
})
export class SubscriptionsModule {}
