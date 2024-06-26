import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppLayoutModule } from "./layout/app.layout.module";
import { ProductService } from "./services/product.service";

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        AppLayoutModule,
    ],
    providers: [ProductService],
    bootstrap: [AppComponent],
})
export class AppModule {}
