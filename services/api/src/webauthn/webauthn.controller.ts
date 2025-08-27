import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { WebAuthnService } from './webauthn.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('webauthn')
export class WebAuthnController {
  constructor(private webAuthnService: WebAuthnService) {}

  @Post('registration/generate-options')
  @UseGuards(JwtAuthGuard)
  async generateRegistrationOptions(@User() user: any) {
    return this.webAuthnService.generateRegistrationOptions(user.id);
  }

  @Post('registration/verify')
  @UseGuards(JwtAuthGuard)
  async verifyRegistration(
    @User() user: any,
    @Body() body: { response: any; expectedChallenge: string },
  ) {
    return this.webAuthnService.verifyRegistration(
      user.id,
      body.response,
      body.expectedChallenge,
    );
  }

  @Post('authentication/generate-options')
  async generateAuthenticationOptions(@Body() body: { userId?: string }) {
    return this.webAuthnService.generateAuthenticationOptions(body.userId);
  }

  @Post('authentication/verify')
  async verifyAuthentication(
    @Body() body: { response: any; expectedChallenge: string; userId?: string },
  ) {
    return this.webAuthnService.verifyAuthentication(
      body.response,
      body.expectedChallenge,
      body.userId,
    );
  }
}
