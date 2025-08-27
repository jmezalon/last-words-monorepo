import { Injectable } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebAuthnService {
  private readonly rpName = process.env.WEBAUTHN_RP_NAME || 'Last Words';
  private readonly rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
  private readonly origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

  constructor(private prisma: PrismaService) {}

  async generateRegistrationOptions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { authenticators: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: this.rpName,
      rpID: this.rpID,
      userID: userId,
      userName: user.email,
      userDisplayName: user.name || user.email,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: user.authenticators.map((authenticator) => ({
        id: Buffer.from(authenticator.credentialID, 'base64url'),
        type: 'public-key',
        transports: authenticator.transports?.split(',') as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: 'discouraged',
      },
      supportedAlgorithmIDs: [-7, -257],
    };

    return generateRegistrationOptions(opts);
  }

  async verifyRegistration(userId: string, response: any, expectedChallenge: string) {
    const opts: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      requireUserVerification: true,
    };

    const verification = await verifyRegistrationResponse(opts);

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      await this.prisma.authenticator.create({
        data: {
          credentialID: Buffer.from(credentialID).toString('base64url'),
          userId,
          providerAccountId: Buffer.from(credentialID).toString('base64url'),
          credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
          counter,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          transports: response.response.transports?.join(','),
        },
      });
    }

    return verification;
  }

  async generateAuthenticationOptions(userId?: string) {
    let allowCredentials;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { authenticators: true },
      });

      if (user) {
        allowCredentials = user.authenticators.map((authenticator) => ({
          id: Buffer.from(authenticator.credentialID, 'base64url'),
          type: 'public-key' as const,
          transports: authenticator.transports?.split(',') as AuthenticatorTransport[],
        }));
      }
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials,
      userVerification: 'required',
      rpID: this.rpID,
    };

    return generateAuthenticationOptions(opts);
  }

  async verifyAuthentication(response: any, expectedChallenge: string, userId?: string) {
    const credentialID = Buffer.from(response.id, 'base64url').toString('base64url');
    
    const authenticator = await this.prisma.authenticator.findUnique({
      where: { credentialID },
      include: { user: true },
    });

    if (!authenticator) {
      throw new Error('Authenticator not found');
    }

    if (userId && authenticator.userId !== userId) {
      throw new Error('Authenticator does not belong to user');
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialID, 'base64url'),
        credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64url'),
        counter: authenticator.counter,
        transports: authenticator.transports?.split(',') as AuthenticatorTransport[],
      },
      requireUserVerification: true,
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (verification.verified) {
      await this.prisma.authenticator.update({
        where: { credentialID },
        data: { counter: verification.authenticationInfo.newCounter },
      });
    }

    return {
      verified: verification.verified,
      user: authenticator.user,
    };
  }
}
