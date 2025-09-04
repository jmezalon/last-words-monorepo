"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtil = void 0;
const crypto = require("crypto");
const bcrypt = require("bcrypt");
class CryptoUtil {
    static generateEmailHmac(email, salt) {
        const actualSalt = salt || crypto.randomBytes(32).toString('hex');
        const hmac = crypto
            .createHmac(this.HMAC_ALGORITHM, actualSalt)
            .update(email.toLowerCase().trim())
            .digest('hex');
        return { hmac, salt: actualSalt };
    }
    static verifyEmailHmac(email, hmac, salt) {
        const { hmac: computedHmac } = this.generateEmailHmac(email, salt);
        return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computedHmac));
    }
    static async hashPassword(password) {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }
    static async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    static generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    static generateSalt(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    static secureCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    }
}
exports.CryptoUtil = CryptoUtil;
CryptoUtil.SALT_ROUNDS = 12;
CryptoUtil.HMAC_ALGORITHM = 'sha256';
//# sourceMappingURL=crypto.util.js.map