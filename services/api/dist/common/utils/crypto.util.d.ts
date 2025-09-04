export declare class CryptoUtil {
    private static readonly SALT_ROUNDS;
    private static readonly HMAC_ALGORITHM;
    static generateEmailHmac(email: string, salt?: string): {
        hmac: string;
        salt: string;
    };
    static verifyEmailHmac(email: string, hmac: string, salt: string): boolean;
    static hashPassword(password: string): Promise<string>;
    static verifyPassword(password: string, hash: string): Promise<boolean>;
    static generateSecureToken(length?: number): string;
    static generateSalt(length?: number): string;
    static secureCompare(a: string, b: string): boolean;
}
