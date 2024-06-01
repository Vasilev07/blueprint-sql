import { Component, OnInit } from '@angular/core';
import { AdministratorDTO } from '../../../typescript-api-client/src/models/administratorDTO';
import { AdminService } from '../../../typescript-api-client/src/clients/admin.service';

@Component({
    selector: 'ngx-users',
    templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
    users: AdministratorDTO[] = [];

    constructor(private adminService: AdminService) {
        // console.log('users');
    }

    ngOnInit(): void {
        this.adminService.getAll().subscribe((users: AdministratorDTO[]) => {
            this.users = users;
            console.log(this.users, 'this users');
        });
    }

    onAddNewUserConfirm(event): void {
        console.log('event in user', event);
    }
}
