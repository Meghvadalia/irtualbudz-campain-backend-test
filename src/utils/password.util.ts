import { Injectable } from '@nestjs/common';
import { genSalt, hash, compare } from 'bcryptjs';

@Injectable()
class PasswordService {
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    const salt: string = await genSalt(this.saltRounds);
    const hashedPassword = await hash(password, salt);
    return hashedPassword;
  }

  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const isMatch = await compare(password, hashedPassword);
    return isMatch;
  }
}

export const passwordService = new PasswordService();
