import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { ThemeModule } from '../../@theme/theme.module';
import { FsIconComponent, TreeGridComponent } from './tree-grid/tree-grid.component';
import { SmartTableComponent } from './smart-table/smart-table.component';
import { TablesComponent } from './tables.component';

@NgModule({
    imports: [
        NbCardModule,
        NbTreeGridModule,
        NbIconModule,
        NbInputModule,
        ThemeModule,
        Ng2SmartTableModule,
    ],
    declarations: [
        TablesComponent,
        SmartTableComponent,
        TreeGridComponent,
        FsIconComponent,
    ],
    exports: [SmartTableComponent]
})
export class TablesModule { }
