import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Configure email transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production: Use AWS SES or similar service
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development: Use Ethereal Email for testing
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'ethereal.pass',
        },
      });
    }
  }

  /**
   * Send alive check email with tracking
   */
  async sendAliveCheckEmail(emailData: AliveCheckEmailData): Promise<boolean> {
    try {
      const html = this.generateAliveCheckHtml(emailData);
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@lastwords.app',
        to: emailData.to,
        subject: emailData.subject,
        html,
        // Add tracking headers
        headers: {
          'X-Last-Words-Type': 'alive-check',
          'X-Last-Words-Template': emailData.template,
        },
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Alive check email sent to ${emailData.to}, messageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send alive check email to ${emailData.to}:`, error);
      return false;
    }
  }

  /**
   * Send notification to trusted contacts
   */
  async sendTrustedContactNotification(emailData: TrustedContactEmailData): Promise<boolean> {
    try {
      const html = this.generateTrustedContactHtml(emailData);
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@lastwords.app',
        to: emailData.to,
        subject: emailData.subject,
        html,
        headers: {
          'X-Last-Words-Type': 'trusted-contact-notification',
        },
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Trusted contact notification sent to ${emailData.to}, messageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send trusted contact notification to ${emailData.to}:`, error);
      return false;
    }
  }

  /**
   * Generate HTML for alive check emails
   */
  private generateAliveCheckHtml(emailData: AliveCheckEmailData): string {
    const { data } = emailData;
    
    const templates = {
      'alive-check-initial': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Digital Legacy - Activity Confirmation</h2>
          <p>Hello ${data.userName},</p>
          <p>This is a routine check to confirm you're still active. As part of your digital legacy plan, 
          we need to verify that you're still using your account.</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Please confirm you're active by clicking the button below:</strong></p>
            <a href="${data.confirmUrl}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm I'm Active
            </a>
          </div>
          
          <p><strong>Important:</strong> You have ${data.daysRemaining} days to respond (until ${data.expiresAt}).</p>
          <p>If you don't respond, we'll send reminders and eventually notify your trusted contacts.</p>
          
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>Last Words Team</p>
          
          <!-- Tracking pixel -->
          <img src="${data.trackingPixelUrl}" width="1" height="1" style="display: none;" />
        </div>
      `,
      
      'alive-check-reminder': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b35;">Digital Legacy - Reminder: Activity Confirmation</h2>
          <p>Hello ${data.userName},</p>
          <p><strong>This is a reminder</strong> - we haven't received confirmation that you're still active.</p>
          
          <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p><strong>Please confirm you're active immediately:</strong></p>
            <a href="${data.confirmUrl}" 
               style="background: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm I'm Active
            </a>
          </div>
          
          <p><strong>Time remaining:</strong> ${data.daysRemaining} days (until ${data.expiresAt})</p>
          <p>If you don't respond, we'll send a final notice and then notify your trusted contacts.</p>
          
          <img src="${data.trackingPixelUrl}" width="1" height="1" style="display: none;" />
        </div>
      `,
      
      'alive-check-final': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">URGENT: Final Notice - Digital Legacy Activation</h2>
          <p>Hello ${data.userName},</p>
          <p><strong>This is your FINAL NOTICE.</strong> We have not received confirmation that you're still active.</p>
          
          <div style="background: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
            <p><strong>IMMEDIATE ACTION REQUIRED:</strong></p>
            <a href="${data.confirmUrl}" 
               style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm I'm Active NOW
            </a>
          </div>
          
          <p><strong>Time remaining:</strong> ${data.daysRemaining} days (until ${data.expiresAt})</p>
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>If you don't respond, your trusted contacts will be notified</li>
            <li>Your digital legacy plan will be activated</li>
            <li>Your secrets will be released to designated beneficiaries</li>
          </ul>
          
          <p>If you're receiving this in error, please contact support immediately.</p>
          
          <img src="${data.trackingPixelUrl}" width="1" height="1" style="display: none;" />
        </div>
      `,
    };

    return templates[emailData.template as keyof typeof templates] || templates['alive-check-initial'];
  }

  /**
   * Generate HTML for trusted contact notifications
   */
  private generateTrustedContactHtml(emailData: TrustedContactEmailData): string {
    const { data } = emailData;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Digital Legacy - User Unresponsive</h2>
        <p>Hello ${data.contactName},</p>
        <p>You are receiving this message because you are listed as a trusted contact for a Last Words user.</p>
        
        <div style="background: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Important Notice:</strong></p>
          <p>The user (${data.userEmail}) has not responded to multiple activity confirmation requests over the past week.</p>
          <p>As per their digital legacy plan, their account is now being processed for legacy release.</p>
        </div>
        
        <p><strong>What this means:</strong></p>
        <ul>
          <li>The user's digital legacy plan is being activated</li>
          <li>Designated beneficiaries will receive their allocated secrets and messages</li>
          <li>This process was set up by the user as part of their digital legacy planning</li>
        </ul>
        
        <p>If you believe this is an error or if you have been in contact with this person recently, 
        please contact our support team immediately.</p>
        
        <p>Escalation Date: ${data.escalationDate}</p>
        
        <p>Best regards,<br>Last Words Team</p>
      </div>
    `;
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email transporter connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email transporter connection failed:', error);
      return false;
    }
  }
}
