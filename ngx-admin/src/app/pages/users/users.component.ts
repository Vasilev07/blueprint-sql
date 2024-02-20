import { Component, OnInit } from "@angular/core";
import { AdminService } from "../../api";

@Component({
    selector: 'ngx-users',
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
    constructor(private adminService: AdminService) {
        console.log('users');
    }
    
    ngOnInit(): void {
        console.log('users');
        
        this.adminService.allGet().subscribe(console.log);
        // throw new Error("Method not implemented.");
    }
    users: any = [];


}