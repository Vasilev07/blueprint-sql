import { Component, inject, OnInit, signal } from "@angular/core";
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
    private readonly authService = inject(AuthService);

    readonly currentUserEmail = signal("");
    readonly incomingRequestsCount = signal(0);
    readonly activeTab = signal("all");

    ngOnInit() {
        this.currentUserEmail.set(this.authService.getUserEmail());
    }

    onRequestCountChange(count: number) {
        this.incomingRequestsCount.set(count);
    }

    onTabChange(value: string | number | undefined) {
        this.activeTab.set(typeof value === "string" ? value : "all");
    }
}
