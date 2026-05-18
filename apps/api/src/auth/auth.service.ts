import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({ where: { email } });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email,
        name: dto.name.trim(),
        passwordHash: this.hashPassword(dto.password),
        role: this.resolveRole(email),
      }),
    );

    return this.sessionFor(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.sessionFor(user);
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

    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user) return null;

    return this.publicUser(user);
  }

  publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
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
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
    };
    const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url');

    return `${payloadPart}.${this.sign(payloadPart)}`;
  }

  private sign(payloadPart: string) {
    return createHmac('sha256', this.secret()).update(payloadPart).digest('base64url');
  }

  private secret() {
    return this.config.get<string>('AUTH_SECRET') ?? 'passmint-dev-secret-change-me';
  }

  private resolveRole(email: string) {
    const adminEmails = (this.config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    return adminEmails.includes(email) ? UserRole.Admin : UserRole.User;
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('base64url');
    const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('base64url');

    return `${salt}.${hash}`;
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
