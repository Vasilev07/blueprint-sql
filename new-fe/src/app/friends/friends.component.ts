import { Component, OnInit } from "@angular/core";
import { AuthService } from "../services/auth.service";

@Component({
    selector: "app-friends",
    templateUrl: "./friends.component.html",
    styleUrls: ["./friends.component.scss"],
})
export class FriendsComponent implements OnInit {
    currentUserEmail: string = "";
    incomingRequestsCount: number = 0;

    constructor(private authService: AuthService) {}

    ngOnInit() {
        this.currentUserEmail = this.authService.getUserEmail();
    }
}
