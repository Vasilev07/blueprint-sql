import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';

import { SmartTableData } from '../../../@core/data/smart-table';

@Component({
    selector: 'ngx-smart-table',
    templateUrl: './smart-table.component.html',
    styleUrls: ['./smart-table.component.scss'],
})
export class SmartTableComponent {

    settings = {
        add: {
            addButtonContent: '<i class="nb-plus"></i>',
            createButtonContent: '<i class="nb-checkmark"></i>',
            cancelButtonContent: '<i class="nb-close"></i>',
        },
        edit: {
            editButtonContent: '<i class="nb-edit"></i>',
            saveButtonContent: '<i class="nb-checkmark"></i>',
            cancelButtonContent: '<i class="nb-close"></i>',
        },
        delete: {
            deleteButtonContent: '<i class="nb-trash"></i>',
            confirmDelete: true,
        },
        columns: {
            id: {
                title: 'ID',
                type: 'number',
            },
            firstname: {
                title: 'First Name',
                type: 'string',
            },
            lastname: {
                title: 'Last Name',
                type: 'string',
            },
            email: {
                title: 'E-mail',
                type: 'string',
            }
        },
    };

    source: LocalDataSource = new LocalDataSource();

    @Input() data: any;

    @Output()
    public readonly createConfirm: EventEmitter<any> = new EventEmitter();

    constructor(private service: SmartTableData) {
    }

    ngOnChanges() {
        if (this.data) {
            console.log('reloaded', this.data);
            this.load(this.data);
        }
    }

    onDeleteConfirm(event): void {
        if (window.confirm('Are you sure you want to delete?')) {
            event.confirm.resolve();
        } else {
            event.confirm.reject();
        }
    }

    load(data) {
        this.source.load(data);
    }

    onCreateConfirm(event) {
        console.log('HOHOHO', event);

        this.createConfirm.emit(event);
    }

    create(event): void {
        console.log(event);

    }
}
