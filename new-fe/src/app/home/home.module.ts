import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

// PrimeNG Modules
import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { TooltipModule } from "primeng/tooltip";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";

// Components
import { HomeComponent } from "./home.component";
import { SharedComponentsModule } from "../shared/components.module";

// Services
import { HomeService } from "./home.service";

const routes: Routes = [
    {
        path: "",
        component: HomeComponent,
    },
];

@NgModule({
    declarations: [HomeComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes),
        ButtonModule,
        DropdownModule,
        TooltipModule,
        ProgressSpinnerModule,
        ToastModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        SharedComponentsModule,
    ],
    providers: [HomeService],
})
export class HomeModule {}
