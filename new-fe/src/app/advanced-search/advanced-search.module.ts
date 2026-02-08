import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

// PrimeNG Imports
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule } from "primeng/slider";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { CheckboxModule } from "primeng/checkbox";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

// Component Imports
import { AdvancedSearchComponent } from "./advanced-search.component";
import { SharedComponentsModule } from "../shared/components.module";

@NgModule({
    declarations: [],
    imports: [
        AdvancedSearchComponent,
        CommonModule,
        FormsModule,
        SharedComponentsModule,
        RouterModule.forChild([
            {
                path: "",
                component: AdvancedSearchComponent,
            },
        ]),
        // PrimeNG Modules
        ButtonModule,
        SelectModule,
        MultiSelectModule,
        SliderModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        CheckboxModule,
        ProgressSpinnerModule,
        ToastModule,
        TooltipModule,
    ],
})
export class AdvancedSearchModule {}

