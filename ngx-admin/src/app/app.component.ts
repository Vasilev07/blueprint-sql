/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from './@core/utils/analytics.service';
import { SeoService } from './@core/utils/seo.service';
import { NbAuthJWTToken, NbAuthService } from '@nebular/auth';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  user = {};

  constructor(private analytics: AnalyticsService, private seoService: SeoService, private authService: NbAuthService) {
  }

  ngOnInit(): void {
    console.log('app component', this.authService.getToken());
    
    this.authService.onTokenChange()
    .subscribe((token: NbAuthJWTToken) => {
      console.log('token', token);

      if (token.isValid()) {
        this.user = token.getPayload(); // here we receive a payload from the token and assigns it to our `user` variable 
        console.log('user', this.user);
        
      }
      
      });  

    this.analytics.trackPageViews();
    this.seoService.trackCanonicalChanges();
  }
}
