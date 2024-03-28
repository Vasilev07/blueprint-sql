import { Component, OnInit } from "@angular/core";
import { AdminService } from "../../api";
import { log } from "console";

@Component({
    selector: 'ngx-users',
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
    users: any = [];

    constructor(private adminService: AdminService) {
        console.log('users');
    }

    ngOnInit(): void {
        console.log('users');

        this.adminService.allGet().subscribe((users) => {
            this.users = users;
            console.log(this.users);

        });
    }

    onAddNewUserConfirm(event): void {
        console.log('event in user', event);
    }
}
