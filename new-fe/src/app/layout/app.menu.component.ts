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
                        label: "Chat",
                        icon: "pi pi-fw pi-comments",
                        routerLink: ["/chat"],
                    },
                    {
                        label: "Live TV",
                        icon: "pi pi-fw pi-video",
                        routerLink: ["/live-tv"],
                    },
                    {
                        label: "Messages",
                        icon: "pi pi-fw pi-envelope",
                        routerLink: ["/messages"],
                    },
                    {
                        label: "Friends",
                        icon: "pi pi-fw pi-users",
                        routerLink: ["/friends"],
                    },
                    {
                        label: "Products",
                        icon: "pi pi-fw pi-table",
                        routerLink: ["/products"],
                    },
                    {
                        label: "Categories",
                        icon: "pi pi-fw pi-folder-open",
                        routerLink: ["/categories"],
                    },
                    {
                        label: "Orders",
                        icon: "pi pi-fw pi-calculator",
                        routerLink: ["/orders"],
                    },
                    {
                        label: "Cart",
                        icon: "pi pi-fw pi-shopping-cart",
                        routerLink: ["/cart"],
                    },
                    {
                        label: "Subscriptions",
                        icon: "pi pi-fw pi-star",
                        routerLink: ["/subscriptions"],
                    },
                ],
            },
        ];
    }
}
