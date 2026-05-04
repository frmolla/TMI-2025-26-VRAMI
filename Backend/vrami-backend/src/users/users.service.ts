import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async register(email: string, password: string, firstName?: string): Promise<User> {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Invalid email format');
    }

    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepo.create({
      email,
      password: hashedPassword,
      firstName,
      isGuest: false,
    });

    return this.usersRepo.save(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async createGuest(): Promise<User> {
    const uniqueEmail = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}@vrami.local`;
    const guestUser = this.usersRepo.create({
      email: uniqueEmail,
      password: 'guest_no_auth',
      isGuest: true,
    });
    return this.usersRepo.save(guestUser);
  }
}