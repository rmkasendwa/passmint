import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.readUser(request);

    if (!user) {
      throw new UnauthorizedException('Login required');
    }

    request.user = user;
    return true;
  }

  private async readUser(request: AuthenticatedRequest) {
    const header = request.headers.authorization;
    const [scheme, token] = header?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) return null;

    return this.authService.verifyToken(token);
  }
}
