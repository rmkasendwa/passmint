import { BadRequestException, ConflictException, Injectable, Logger, OnApplicationBootstrap, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import { prefixedId } from '../common/prefixed-id';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
};

type OAuthStatePayload = {
  exp: number;
  nonce: string;
  next?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export const GOOGLE_OAUTH_STATE_COOKIE = 'passmint-google-oauth-state';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.reconcileRootAdmin();
  }

  async reconcileRootAdmin() {
    const email = this.rootAdminEmail();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: {
          role: UserRole.RootAdmin,
          ...(email ? { email: { not: email } } : {}),
        },
        data: { role: UserRole.User },
      });
      if (email) {
        await tx.user.updateMany({
          where: { email },
          data: { role: UserRole.RootAdmin },
        });
      }
    });
    this.logger.log(
      email
        ? 'Root administrator configuration reconciled.'
        : 'No root administrator is configured.',
    );
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        id: prefixedId('usr'),
        email,
        name: dto.name.trim(),
        passwordHash: this.hashPassword(dto.password),
        role: email === this.rootAdminEmail() ? UserRole.RootAdmin : UserRole.User,
      },
    });

    return this.sessionFor(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.sessionFor(user);
  }

  googleAuthorization(next?: string) {
    const clientId = this.requiredGoogleConfig('GOOGLE_CLIENT_ID');
    const redirectUri = this.googleRedirectUri();
    const state = this.createOAuthState(next);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });

    return { state, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
  }

  googleStateCookie() {
    return {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
      path: '/',
      sameSite: 'lax' as const,
      secure: this.config.get<string>('NODE_ENV') === 'production',
    };
  }

  async loginWithGoogleCode(code: string, state: string) {
    const payload = this.verifyOAuthState(state);
    const accessToken = await this.exchangeGoogleCode(code);
    const profile = await this.fetchGoogleProfile(accessToken);
    const email = profile.email?.trim().toLowerCase();

    if (!email || !profile.email_verified) {
      throw new UnauthorizedException('Google did not return a verified email address.');
    }

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: prefixedId('usr'),
        email,
        name: profile.name?.trim() || email.split('@')[0],
        passwordHash: this.unusablePasswordHash(),
        role: email === this.rootAdminEmail() ? UserRole.RootAdmin : UserRole.User,
      },
    });

    if (user.role !== UserRole.RootAdmin && email === this.rootAdminEmail()) {
      const promoted = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.RootAdmin },
      });
      return { ...this.sessionFor(promoted), next: payload.next };
    }

    return { ...this.sessionFor(user), next: payload.next };
  }

  async verifyToken(token: string) {
    const [payloadPart, signature] = token.split('.');
    if (!payloadPart || !signature) return null;

    const expected = this.sign(payloadPart);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;

    return this.publicUser(user);
  }

  publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };
  }

  private sessionFor(user: User) {
    return {
      token: this.createToken(user),
      user: this.publicUser(user),
    };
  }

  private createToken(user: User) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
    };
    const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url');

    return `${payloadPart}.${this.sign(payloadPart)}`;
  }

  private sign(payloadPart: string) {
    return createHmac('sha256', this.secret()).update(payloadPart).digest('base64url');
  }

  private createOAuthState(next?: string) {
    const payload: OAuthStatePayload = {
      exp: Math.floor(Date.now() / 1000) + 60 * 10,
      nonce: randomBytes(16).toString('base64url'),
      ...(this.safeNextPath(next) ? { next } : {}),
    };
    const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url');

    return `${payloadPart}.${this.sign(payloadPart)}`;
  }

  private verifyOAuthState(state: string) {
    const [payloadPart, signature] = state.split('.');
    if (!payloadPart || !signature) throw new BadRequestException('Invalid Google sign-in state.');

    const expected = this.sign(payloadPart);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
      throw new BadRequestException('Invalid Google sign-in state.');
    }

    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new BadRequestException('Google sign-in state expired.');
    }

    return {
      ...payload,
      next: this.safeNextPath(payload.next) ? payload.next : undefined,
    };
  }

  private async exchangeGoogleCode(code: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.requiredGoogleConfig('GOOGLE_CLIENT_ID'),
        client_secret: this.requiredGoogleConfig('GOOGLE_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.googleRedirectUri(),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as GoogleTokenResponse;

    if (!response.ok || !data.access_token) {
      throw new UnauthorizedException(data.error_description || data.error || 'Google sign-in failed.');
    }

    return data.access_token;
  }

  private async fetchGoogleProfile(accessToken: string) {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Unable to read your Google profile.');
    }

    return (await response.json()) as GoogleUserInfo;
  }

  private googleRedirectUri() {
    const webOrigin = this.webOrigin();
    const configured = this.config.get<string>('GOOGLE_REDIRECT_URI')?.trim();
    return configured
      ? this.publicUrl(configured, 'GOOGLE_REDIRECT_URI')
      : `${webOrigin}/auth/google/callback`;
  }

  private webOrigin() {
    const configured = (
      this.config.get<string>('WEB_ORIGIN') ??
      this.config.get<string>('CORS_ORIGIN')
    )?.trim();
    if (configured) return new URL(this.publicUrl(configured, 'WEB_ORIGIN')).origin;

    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new BadRequestException('WEB_ORIGIN must be configured for Google sign-in.');
    }

    const port = this.config.get<string>('WEB_PORT') ?? '8088';
    return `http://localhost:${port}`;
  }

  private publicUrl(value: string, key: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException(`${key} must be a valid HTTP URL.`);
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new BadRequestException(`${key} must be a valid HTTP URL.`);
    }

    if (['0.0.0.0', '[::]', '::'].includes(url.hostname)) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new BadRequestException(`${key} must use a public hostname.`);
      }
      url.hostname = 'localhost';
    }

    return url.toString().replace(/\/$/, '');
  }

  googleCallbackUrl(token: string, next?: string) {
    const url = new URL('/auth/google/callback', this.webOrigin());
    url.searchParams.set('token', token);
    if (next && this.safeNextPath(next)) url.searchParams.set('next', next);
    return url.toString();
  }

  googleFailureUrl(message: string) {
    const url = new URL('/login', this.webOrigin());
    url.searchParams.set('error', message);
    return url.toString();
  }

  private requiredGoogleConfig(key: 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET') {
    const value = this.config.get<string>(key)?.trim();
    if (!value) throw new BadRequestException('Google sign-in is not configured.');
    return value;
  }

  private safeNextPath(value?: string) {
    return Boolean(value && value.startsWith('/') && !value.startsWith('//'));
  }

  private secret() {
    return this.config.get<string>('AUTH_SECRET') ?? 'passmint-dev-secret-change-me';
  }

  private rootAdminEmail() {
    const value = (this.config.get<string>('ROOT_ADMIN_EMAIL') ?? '')
      .trim()
      .toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('base64url');
    const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('base64url');

    return `${salt}.${hash}`;
  }

  private unusablePasswordHash() {
    return `oauth-google.${randomBytes(32).toString('base64url')}`;
  }

  private verifyPassword(password: string, stored: string) {
    const [salt, hash] = stored.split('.');
    if (!salt || !hash) return false;

    const attempted = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('base64url');
    const expectedBuffer = Buffer.from(hash);
    const actualBuffer = Buffer.from(attempted);

    return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
