import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from './auth.types';
import { isPlatformAdmin } from '../users/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user || !isPlatformAdmin(request.user.role)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
