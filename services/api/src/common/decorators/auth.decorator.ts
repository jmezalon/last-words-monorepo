import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRES_WEBAUTHN_KEY = 'requiresWebAuthn';
export const RequiresWebAuthn = () => SetMetadata(REQUIRES_WEBAUTHN_KEY, true);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

export interface AuthenticatedUser {
  id: string;
  email: string;
  emailHmac: string;
  webAuthnVerified?: boolean;
  iat?: number;
  exp?: number;
}
