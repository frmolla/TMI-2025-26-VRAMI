import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

export interface AuthPayload {
  sub: string;
  email: string;
  type: 'user' | 'guest';
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      type: 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        isGuest: false,
      },
    };
  }

  async register(email: string, password: string, firstName?: string): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.usersService.register(email, password, firstName);

    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      type: 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        isGuest: false,
      },
    };
  }

  async loginAsGuest(): Promise<{ access_token: string; user: Partial<User> }> {
    const guestUser = await this.usersService.createGuest();

    const payload: AuthPayload = {
      sub: guestUser.id,
      email: guestUser.email,
      type: 'guest',
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '8h' }),
      user: {
        id: guestUser.id,
        email: guestUser.email,
        isGuest: true,
      },
    };
  }

  async validateToken(payload: AuthPayload): Promise<User> {
    return this.usersService.findById(payload.sub);
  }
}