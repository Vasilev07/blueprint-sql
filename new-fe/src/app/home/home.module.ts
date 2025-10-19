import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

// PrimeNG Modules
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DropdownModule } from "primeng/dropdown";
import { TooltipModule } from "primeng/tooltip";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";
import { AvatarModule } from "primeng/avatar";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";

// Components
import { HomeComponent } from "./home.component";
import { UserCardComponent } from "./user-card/user-card.component";

// Services
import { HomeService } from "./home.service";

const routes: Routes = [
    {
        path: "",
        component: HomeComponent,
    },
];

@NgModule({
    declarations: [HomeComponent, UserCardComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes),
        ButtonModule,
        CardModule,
        DropdownModule,
        TooltipModule,
        ProgressSpinnerModule,
        ToastModule,
        AvatarModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
    ],
    providers: [HomeService],
})
export class HomeModule {}
