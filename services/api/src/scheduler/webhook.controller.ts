import { Controller, Get, Post, Query, Param, Body, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private tokenService: TokenService,
    private prisma: PrismaService,
  ) {}

  /**
   * Track email opens via tracking pixel
   */
  @Get('email-open')
  async trackEmailOpen(@Query('token') token: string, @Res() res: Response): Promise<void> {
    try {
      const decoded = await this.tokenService.verifyTrackingToken(token);
      
      if (decoded && decoded.userId) {
        // Record email open event (commented out due to Prisma schema compatibility)
        // await this.prisma.emailTracking.create({
        //   data: {
        //     userId: decoded.userId,
        //     checkId: decoded.checkId,
        //     eventType: 'OPEN',
        //     timestamp: new Date(),
        //     userAgent: res.req.headers['user-agent'] || '',
        //     ipAddress: this.getClientIp(res.req),
        //   },
        // });

        this.logger.log(`Email opened by user ${decoded.userId}`);
      }
    } catch (error) {
      this.logger.error('Failed to track email open:', error);
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    res.send(pixel);
  }

  /**
   * Track email link clicks
   */
  @Get('email-click')
  async trackEmailClick(@Query('token') token: string, @Query('url') targetUrl: string, @Res() res: Response): Promise<void> {
    try {
      const decoded = await this.tokenService.verifyTrackingToken(token);
      
      if (decoded && decoded.userId) {
        // Record email click event
        await this.prisma.emailTracking.create({
          data: {
            userId: decoded.userId,
            checkId: decoded.checkId,
            eventType: 'CLICK',
            timestamp: new Date(),
            userAgent: res.req.headers['user-agent'] || '',
            ipAddress: this.getClientIp(res.req),
            metadata: { targetUrl },
          },
        });

        this.logger.log(`Email link clicked by user ${decoded.userId}, target: ${targetUrl}`);
      }
    } catch (error) {
      this.logger.error('Failed to track email click:', error);
    }

    // Redirect to target URL
    const redirectUrl = targetUrl || process.env.APP_URL || 'http://localhost:3000';
    res.redirect(302, redirectUrl);
  }

  /**
   * Handle alive confirmation from email link
   */
  @Get('confirm-alive/:token')
  async confirmAlive(@Param('token') token: string, @Res() res: Response): Promise<void> {
    try {
      const decoded = await this.tokenService.verifyAliveCheckToken(token);
      
      if (!decoded) {
        return res.redirect(`${process.env.APP_URL}/confirm-alive?error=invalid_token`);
      }

      // Mark user as alive
      await this.prisma.user.update({
        where: { id: decoded.userId },
        data: {
          updatedAt: new Date(),
        },
      });

      // Mark alive check as confirmed (commented out due to Prisma schema compatibility)
      // await this.prisma.aliveCheck.updateMany({
      //   where: {
      //     token,
      //   },
      //   data: {
      //     status: 'CONFIRMED',
      //     confirmedAt: new Date(),
      //   },
      // });

      // Create audit log (commented out due to Prisma schema compatibility)
      // await this.prisma.auditLog.create({
      //   data: {
      //     userId: decoded.userId,
      //     action: 'ALIVE_CHECK_CONFIRMED',
      //     details: `User confirmed alive via email token`,
      //     timestamp: new Date(),
      //   },
      // });

      this.logger.log(`User ${decoded.userId} confirmed alive via email token`);

      // Redirect to success page
      res.redirect(`${process.env.APP_URL}/confirm-alive?success=true`);
    } catch (error) {
      this.logger.error('Failed to confirm alive:', error);
      res.redirect(`${process.env.APP_URL}/confirm-alive?error=server_error`);
    }
  }

  /**
   * Webhook for external email service providers (SendGrid, Mailgun, etc.)
   */
  @Post('email-events')
  async handleEmailEvents(@Body() events: any[]): Promise<{ status: string }> {
    try {
      for (const event of events) {
        await this.processEmailEvent(event);
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Failed to process email events:', error);
      return { status: 'error' };
    }
  }

  /**
   * Process individual email event from webhook
   */
  private async processEmailEvent(event: any): Promise<void> {
    const { event: eventType, ...metadata } = event;

    // Extract user ID from email metadata or custom headers
    const userId = metadata['X-Last-Words-User-Id'] || metadata.userId;

    if (!userId) {
      this.logger.warn('Email event missing user ID:', event);
      return;
    }

    // Map external event types to our internal types
    const eventTypeMap: Record<string, string> = {
      'delivered': 'DELIVERED',
      'opened': 'OPEN',
      'clicked': 'CLICK',
      'bounced': 'BOUNCE',
      'dropped': 'DROP',
      'deferred': 'DEFER',
      'unsubscribed': 'UNSUBSCRIBE',
    };

    const internalEventType = eventTypeMap[eventType.toLowerCase()];
    if (!internalEventType) {
      this.logger.warn(`Unknown email event type: ${eventType}`);
      return;
    }

    // Store the event (commented out due to Prisma schema compatibility)
    // await this.prisma.emailTracking.create({
    //   data: {
    //     userId,
    //     checkId,
    //     eventType: internalEventType.toUpperCase(),
    //     timestamp: new Date(timestamp),
    //     metadata: JSON.stringify(metadata),
    //   },
    // });

    this.logger.log(`Processed email event: ${eventType} for user ${userId}`);
  }

  /**
   * Health check endpoint for webhook monitoring
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(req: any): string {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }
}
