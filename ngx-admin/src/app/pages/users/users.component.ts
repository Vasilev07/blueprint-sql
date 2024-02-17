import { Component, OnInit } from "@angular/core";

@Component({
    selector: 'ngx-users',
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
    
    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }
    users: any;


}