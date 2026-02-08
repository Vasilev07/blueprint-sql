import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { TabsModule } from "primeng/tabs";
import { AllUsersComponent } from "./all-users/all-users.component";
import { FriendRequestsComponent } from "./friend-requests/friend-requests.component";
import { MyFriendsComponent } from "./my-friends/my-friends.component";

@Component({
    selector: "app-friends",
    standalone: true,
    imports: [
        CommonModule,
        ToastModule,
        ConfirmDialogModule,
        TabsModule,
        AllUsersComponent,
        FriendRequestsComponent,
        MyFriendsComponent,
    ],
    templateUrl: "./friends.component.html",
    styleUrls: ["./friends.component.scss"],
})
export class FriendsComponent implements OnInit {
    currentUserEmail: string = "";
    incomingRequestsCount: number = 0;
    activeTab: string = "all";

    constructor(private authService: AuthService) {}

    ngOnInit() {
        this.currentUserEmail = this.authService.getUserEmail();
    }

    onRequestCountChange(count: number) {
        this.incomingRequestsCount = count;
    }

    onTabChange(value: string | number | undefined) {
        this.activeTab = typeof value === "string" ? value : "all";
    }
}
