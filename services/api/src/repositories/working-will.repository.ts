import { Injectable } from '@nestjs/common';
import { Will } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateWillData {
  userId: string;
  encryptedTitle?: string;
  encryptedDescription?: string;
  encryptedContent?: string;
  requiresWebAuthn?: boolean;
  accessLevel?: string;
  releaseConditions?: string;
  autoReleaseEnabled?: boolean;
  manualReleaseEnabled?: boolean;
}

export interface UpdateWillData {
  encryptedTitle?: string;
  encryptedDescription?: string;
  encryptedContent?: string;
  requiresWebAuthn?: boolean;
  accessLevel?: string;
  releaseConditions?: string;
  autoReleaseEnabled?: boolean;
  manualReleaseEnabled?: boolean;
  status?: string;
}

@Injectable()
export class WorkingWillRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateWillData): Promise<Will> {
    return this.prisma.will.create({
      data: {
        userId: data.userId,
        encryptedTitle: data.encryptedTitle,
        encryptedDescription: data.encryptedDescription,
        encryptedContent: data.encryptedContent || '',
        requiresWebAuthn: data.requiresWebAuthn ?? true,
        accessLevel: data.accessLevel || 'PRIVATE',
        releaseConditions: data.releaseConditions || '{}',
        autoReleaseEnabled: data.autoReleaseEnabled ?? false,
        manualReleaseEnabled: data.manualReleaseEnabled ?? true,
      },
    });
  }

  async findById(id: string, userId?: string): Promise<Will | null> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.will.findFirst({
      where,
      include: {
        secrets: true,
        willBeneficiaries: {
          include: {
            beneficiary: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string, skip = 0, take = 10): Promise<Will[]> {
    return this.prisma.will.findMany({
      where: { userId },
      skip,
      take,
      include: {
        secrets: true,
        willBeneficiaries: {
          include: {
            beneficiary: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: UpdateWillData,
    userId?: string
  ): Promise<Will> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.will.update({
      where,
      data,
    });
  }

  async delete(id: string, userId?: string): Promise<Will> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.will.delete({
      where,
    });
  }

  async findByStatus(status: string, userId?: string): Promise<Will[]> {
    const where: any = { status };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.will.findMany({
      where,
      include: {
        secrets: true,
        willBeneficiaries: {
          include: {
            beneficiary: true,
          },
        },
      },
    });
  }
}
