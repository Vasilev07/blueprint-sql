/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {
    NbButtonModule,
  NbInputModule,
} from '@nebular/theme';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NbAuthModule } from '@nebular/auth';
import { NgxLoginComponent } from './login/login.component';

@NgModule({
  declarations: [ NgxLoginComponent ],
  imports: [
    FormsModule,
    CommonModule,
    NbInputModule,
    NbAuthModule,
    NbButtonModule
  ]
})
export class AuthModule {
}
