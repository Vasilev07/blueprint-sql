import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputTextareaModule } from "primeng/inputtextarea";
import { InputNumberModule } from "primeng/inputnumber";
import { AutoCompleteModule } from "primeng/autocomplete";
import { AvatarModule } from "primeng/avatar";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";
import { DialogModule } from "primeng/dialog";
import { MessageService } from "primeng/api";

import { GiftShopComponent } from "./gift-shop.component";

const routes: Routes = [
    {
        path: "",
        component: GiftShopComponent,
    },
];

@NgModule({
    declarations: [GiftShopComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        InputTextModule,
        ButtonModule,
        CardModule,
        InputTextareaModule,
        InputNumberModule,
        AutoCompleteModule,
        AvatarModule,
        ProgressSpinnerModule,
        ToastModule,
        DialogModule,
    ],
    providers: [MessageService],
})
export class GiftShopModule {}

