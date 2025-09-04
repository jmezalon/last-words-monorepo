import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoUtil } from '../common/utils/crypto.util';

export interface CreateUserData {
  email: string;
  name?: string;
  encryptedPersonalData?: string;
  masterKeyWrapped?: string;
  keyDerivationSalt?: string;
  timezone?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  encryptedPersonalData?: string;
  masterKeyWrapped?: string;
  keyDerivationSalt?: string;
  timezone?: string;
}

@Injectable()
export class WorkingUserRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    const { hmac: emailHmac } = CryptoUtil.generateEmailHmac(data.email);

    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        emailHmac,
        encryptedPersonalData: data.encryptedPersonalData,
        masterKeyWrapped: data.masterKeyWrapped,
        keyDerivationSalt: data.keyDerivationSalt,
        timezone: data.timezone || 'UTC',
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailHmac(emailHmac: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { emailHmac },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const updateData: any = { ...data };

    if (data.email) {
      const { hmac: emailHmac } = CryptoUtil.generateEmailHmac(data.email);
      updateData.emailHmac = emailHmac;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findMany(skip = 0, take = 10): Promise<User[]> {
    return this.prisma.user.findMany({
      skip,
      take,
    });
  }
}
