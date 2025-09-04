export interface AliveCheckTokenPayload {
    userId: string;
    checkId: string;
    type: 'alive-check';
    issuedAt: number;
    expiresAt: number;
}
export declare class TokenService {
    private readonly logger;
    private readonly secret;
    constructor();
    generateAliveCheckToken(userId: string, expiresAt: Date): Promise<string>;
    verifyAliveCheckToken(token: string): Promise<AliveCheckTokenPayload | null>;
    generateTrackingToken(userId: string, checkId: string, type: 'open' | 'click'): Promise<string>;
    verifyTrackingToken(token: string): Promise<any>;
    generateIdempotencyKey(userId: string, action: string, timestamp?: Date): string;
    createConfirmationUrl(token: string, baseUrl?: string): string;
    createTrackingPixelUrl(token: string, baseUrl?: string): string;
}
