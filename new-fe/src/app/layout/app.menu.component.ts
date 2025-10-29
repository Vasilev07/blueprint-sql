import { Component, OnInit, OnDestroy } from "@angular/core";
import { LayoutService } from "./service/app.layout.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../services/auth.service";

@Component({
    selector: "app-menu",
    templateUrl: "./app.menu.component.html",
})
export class AppMenuComponent implements OnInit, OnDestroy {
    model: any[] = [];
    isAdmin = false;
    private destroy$ = new Subject<void>();

    constructor(
        public layoutService: LayoutService,
        private jwtHelper: JwtHelperService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.checkAdminRole();
        this.buildMenu();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkAdminRole(): void {
        this.isAdmin = this.authService.isAdmin();
    }

    private buildMenu(): void {
        const menuItems = [
            {
                label: "Dashboard",
                icon: "pi pi-fw pi-home",
                routerLink: ["/"],
            },
            {
                label: "Home",
                icon: "pi pi-fw pi-compass",
                routerLink: ["/home"],
            },
            {
                label: "Advanced Search",
                icon: "pi pi-fw pi-filter",
                routerLink: ["/advanced-search"],
            },
            {
                label: "Chat",
                icon: "pi pi-fw pi-comments",
                routerLink: ["/chat"],
            },
            {
                label: "Stories",
                icon: "pi pi-fw pi-images",
                routerLink: ["/stories"],
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
            {
                label: "Gift Shop",
                icon: "pi pi-fw pi-gift",
                routerLink: ["/gift-shop"],
            },
            {
                label: "Profile",
                icon: "pi pi-fw pi-user",
                routerLink: ["/profile"],
            },
        ];

        // Add admin items if user is admin
        if (this.isAdmin) {
            menuItems.push({
                label: "Admin Verification Management",
                icon: "pi pi-fw pi-shield",
                routerLink: ["/admin"],
            });
            menuItems.push({
                label: "Admin Transaction Management",
                icon: "pi pi-fw pi-wallet",
                routerLink: ["/admin/transactions"],
            });
        }

        this.model = [
            {
                label: "Home",
                items: menuItems,
            },
        ];
    }


}
