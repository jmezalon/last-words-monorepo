export interface AliveCheckEmailData {
    to: string;
    subject: string;
    template: string;
    data: {
        userName: string;
        token: string;
        expiresAt: string;
        confirmUrl: string;
        trackingPixelUrl: string;
        daysRemaining: number;
    };
}
export interface TrustedContactEmailData {
    to: string;
    subject: string;
    data: {
        contactName: string;
        userEmail: string;
        escalationDate: string;
    };
}
export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    private initializeTransporter;
    sendAliveCheckEmail(emailData: AliveCheckEmailData): Promise<boolean>;
    sendTrustedContactNotification(emailData: TrustedContactEmailData): Promise<boolean>;
    private generateAliveCheckHtml;
    private generateTrustedContactHtml;
    testConnection(): Promise<boolean>;
}
