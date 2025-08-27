import { WebAuthnService } from './webauthn.service';
export declare class WebAuthnController {
    private webAuthnService;
    constructor(webAuthnService: WebAuthnService);
    generateRegistrationOptions(user: any): unknown;
    verifyRegistration(user: any, body: {
        response: any;
        expectedChallenge: string;
    }): unknown;
    generateAuthenticationOptions(body: {
        userId?: string;
    }): unknown;
    verifyAuthentication(body: {
        response: any;
        expectedChallenge: string;
        userId?: string;
    }): unknown;
}
