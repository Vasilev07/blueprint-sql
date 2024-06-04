import { Component, OnInit } from '@angular/core';
import { DefaultService } from '../../../typescript-api-client/src/clients/default.service';

@Component({
    selector: 'ngx-users',
    templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
    users: any = [];

    constructor(private adminService: DefaultService) {
        console.log('users');
    }

    ngOnInit(): void {
        console.log('users');

        this.adminService.getAll().subscribe((users) => {
            this.users = users;
            console.log(this.users);

        });
    }

    onAddNewUserConfirm(event): void {
        console.log('event in user', event);
    }
}
