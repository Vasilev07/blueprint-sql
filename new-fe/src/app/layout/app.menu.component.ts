import { Component, OnInit } from "@angular/core";
import { LayoutService } from "./service/app.layout.service";

@Component({
    selector: "app-menu",
    templateUrl: "./app.menu.component.html",
})
export class AppMenuComponent implements OnInit {
    model: any[] = [];

    constructor(public layoutService: LayoutService) {}

    ngOnInit(): void {
        this.model = [
            {
                label: "Home",
                items: [
                    {
                        label: "Dashboard",
                        icon: "pi pi-fw pi-home",
                        routerLink: ["/"],
                    },
                    {
                        label: "Products",
                        icon: "pi pi-fw pi-table",
                        routerLink: ["/products"],
                    },
                    {
                        label: "Orders",
                        icon: "pi pi-fw pi-calculator",
                        routerLink: ["/orders"],
                    },
                ],
            },
        ];
    }
}
