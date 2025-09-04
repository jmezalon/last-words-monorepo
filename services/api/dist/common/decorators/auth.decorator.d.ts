export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const REQUIRES_WEBAUTHN_KEY = "requiresWebAuthn";
export declare const RequiresWebAuthn: () => import("@nestjs/common").CustomDecorator<string>;
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export interface AuthenticatedUser {
    id: string;
    email: string;
    emailHmac: string;
    webAuthnVerified?: boolean;
    iat?: number;
    exp?: number;
}
