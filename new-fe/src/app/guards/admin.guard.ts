import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private jwtHelper: JwtHelperService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = localStorage.getItem('id_token');
    
    if (!token || this.jwtHelper.isTokenExpired(token)) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const tokenPayload = this.jwtHelper.decodeToken(token);
      
      // Check if user has admin role
      if (tokenPayload.roles) {
        // Handle both array format ["user", "admin"] and object format {admin}
        let isAdmin = false;
        if (Array.isArray(tokenPayload.roles)) {
          isAdmin = tokenPayload.roles.includes('admin');
        } else if (typeof tokenPayload.roles === 'object' && tokenPayload.roles !== null) {
          isAdmin = tokenPayload.roles.hasOwnProperty('admin') || tokenPayload.roles.admin === true;
        }
        
        if (isAdmin) {
          return true;
        }
      }
      
      // Redirect to home if not admin
      this.router.navigate(['/']);
      return false;
    } catch (error) {
      console.error('Error decoding token:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
