import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkingSecretRepository } from '../repositories/working-secret.repository';
import { WorkingUserRepository } from '../repositories/working-user.repository';
import { randomBytes } from 'crypto';

export interface EncryptedSecretData {
  encryptedCIK: string;
  ciphertext: string;
  nonce: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

@Injectable()
export class CryptoService {
  constructor(
    private prisma: PrismaService,
    private secretRepository: WorkingSecretRepository,
    private userRepository: WorkingUserRepository,
  ) {}

  /**
   * Generates a random key of specified length
   */
  async generateRandomKey(length: number): Promise<Uint8Array> {
    return new Uint8Array(randomBytes(length));
  }

  /**
   * Gets or creates a master key for the user
   */
  async getUserMasterKey(userId: string): Promise<Uint8Array> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // If user doesn't have a master key, generate one
    if (!user.masterKeyWrapped) {
      const masterKey = await this.generateRandomKey(32);
      
      // For now, store the master key directly (in production, this should be properly wrapped)
      await this.userRepository.update(userId, {
        masterKeyWrapped: Buffer.from(masterKey).toString('base64')
      });
      
      return masterKey;
    }

    // Return existing master key
    return new Uint8Array(Buffer.from(user.masterKeyWrapped, 'base64'));
  }

  /**
   * Stores an encrypted secret for the user
   */
  async storeEncryptedSecret(userId: string, secretData: EncryptedSecretData) {
    // Get user's active will (create one if doesn't exist)
    const will = await this.getOrCreateUserWill(userId);
    
    // Store the encrypted secret
    const secret = await this.secretRepository.create({
      willId: will.id,
      encryptedTitle: secretData.title,
      encryptedDescription: secretData.description,
      encryptedContent: secretData.ciphertext,
      encryptedMetadata: JSON.stringify({
        encryptedCIK: secretData.encryptedCIK,
        nonce: secretData.nonce
      }),
      category: secretData.category,
      tags: secretData.tags || [],
      secretType: 'encrypted_data'
    });

    return secret;
  }

  /**
   * Gets or creates a will for the user
   */
  private async getOrCreateUserWill(userId: string) {
    // Check if user has an active will
    const existingWill = await this.prisma.will.findFirst({
      where: {
        userId,
        isActive: true
      }
    });

    if (existingWill) {
      return existingWill;
    }

    // Create a new will
    const will = await this.prisma.will.create({
      data: {
        userId,
        encryptedTitle: 'My Digital Legacy',
        encryptedDescription: 'Secure storage for my digital secrets',
        encryptedContent: '',
        releaseConditions: {},
        status: 'DRAFT'
      }
    });

    return will;
  }

  /**
   * Retrieves an encrypted secret
   */
  async getEncryptedSecret(secretId: string, userId: string) {
    const secret = await this.prisma.secret.findFirst({
      where: {
        id: secretId,
        will: {
          userId
        }
      },
      include: {
        will: true
      }
    });

    if (!secret) {
      throw new HttpException('Secret not found', HttpStatus.NOT_FOUND);
    }

    const metadata = JSON.parse(secret.encryptedMetadata || '{}');
    
    return {
      id: secret.id,
      encryptedCIK: metadata.encryptedCIK,
      ciphertext: secret.encryptedContent,
      nonce: metadata.nonce,
      title: secret.encryptedTitle,
      description: secret.encryptedDescription,
      category: secret.category,
      tags: secret.tags
    };
  }
}
