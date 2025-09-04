import { Injectable } from '@nestjs/common';
import { Secret } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateSecretData {
  willId: string;
  encryptedTitle?: string;
  encryptedDescription?: string;
  encryptedContent?: string;
  secretType?: string;
  encryptedMetadata?: string;
  category?: string;
  tags?: string[];
  priority?: number;
  requiresWebAuthn?: boolean;
  accessLevel?: string;
}

export interface UpdateSecretData {
  encryptedTitle?: string;
  encryptedDescription?: string;
  encryptedContent?: string;
  secretType?: string;
  encryptedMetadata?: string;
  category?: string;
  tags?: string[];
  priority?: number;
  requiresWebAuthn?: boolean;
  accessLevel?: string;
}

@Injectable()
export class WorkingSecretRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSecretData): Promise<Secret> {
    return this.prisma.secret.create({
      data: {
        willId: data.willId,
        encryptedTitle: data.encryptedTitle,
        encryptedDescription: data.encryptedDescription,
        encryptedContent: data.encryptedContent || '',
        secretType: data.secretType,
        encryptedMetadata: data.encryptedMetadata,
        category: data.category,
        tags: data.tags,
        priority: data.priority ?? 1,
        requiresWebAuthn: data.requiresWebAuthn ?? true,
        accessLevel: data.accessLevel || 'PRIVATE',
      },
    });
  }

  async findById(id: string, userId?: string): Promise<Secret | null> {
    const secret = await this.prisma.secret.findUnique({
      where: { id },
      include: {
        will: true,
      },
    });

    if (secret && userId && secret.will.userId !== userId) {
      return null;
    }

    return secret;
  }

  async findByWillId(willId: string, userId?: string): Promise<Secret[]> {
    if (userId) {
      const will = await this.prisma.will.findFirst({
        where: { id: willId, userId },
      });
      if (!will) return [];
    }

    return this.prisma.secret.findMany({
      where: { willId },
      include: {
        will: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateSecretData,
    userId?: string
  ): Promise<Secret> {
    if (userId) {
      const secret = await this.prisma.secret.findUnique({
        where: { id },
        include: { will: true },
      });
      if (!secret || secret.will.userId !== userId) {
        throw new Error('Secret not found or access denied');
      }
    }

    return this.prisma.secret.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId?: string): Promise<Secret> {
    if (userId) {
      const secret = await this.prisma.secret.findUnique({
        where: { id },
        include: { will: true },
      });
      if (!secret || secret.will.userId !== userId) {
        throw new Error('Secret not found or access denied');
      }
    }

    return this.prisma.secret.delete({
      where: { id },
    });
  }

  async findByCategory(category: string, userId?: string): Promise<Secret[]> {
    const where: any = { category };

    if (userId) {
      where.will = { userId };
    }

    return this.prisma.secret.findMany({
      where,
      include: {
        will: true,
      },
    });
  }

  async searchByTags(tags: string[], userId?: string): Promise<Secret[]> {
    const where: any = {};

    if (userId) {
      where.will = { userId };
    }

    return this.prisma.secret.findMany({
      where,
      include: {
        will: true,
      },
    });
  }
}
