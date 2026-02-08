import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LayoutService } from "./service/app.layout.service";

@Component({
    selector: "app-footer",
    standalone: true,
    imports: [CommonModule],
    templateUrl: "./app.footer.component.html",
})
export class AppFooterComponent {
    constructor(public layoutService: LayoutService) {}
}
