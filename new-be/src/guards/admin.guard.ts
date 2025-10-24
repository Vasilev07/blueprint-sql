import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.userData;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (!user.roles || !user.roles.includes(Role.Admin)) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
