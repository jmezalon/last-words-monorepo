import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function registerWebAuthn(token: string) {
  try {
    // Get registration options from server
    const optionsResponse = await fetch(`${API_BASE_URL}/webauthn/registration/generate-options`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get registration options');
    }

    const options = await optionsResponse.json();

    // Start registration with the browser
    const attResp = await startRegistration(options);

    // Verify registration with server
    const verificationResponse = await fetch(`${API_BASE_URL}/webauthn/registration/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: attResp,
        expectedChallenge: options.challenge,
      }),
    });

    if (!verificationResponse.ok) {
      throw new Error('Failed to verify registration');
    }

    const verification = await verificationResponse.json();
    return verification;
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    throw error;
  }
}

export async function authenticateWebAuthn(userId?: string) {
  try {
    // Get authentication options from server
    const optionsResponse = await fetch(`${API_BASE_URL}/webauthn/authentication/generate-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get authentication options');
    }

    const options = await optionsResponse.json();

    // Start authentication with the browser
    const asseResp = await startAuthentication(options);

    // Verify authentication with server
    const verificationResponse = await fetch(`${API_BASE_URL}/webauthn/authentication/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: asseResp,
        expectedChallenge: options.challenge,
        userId,
      }),
    });

    if (!verificationResponse.ok) {
      throw new Error('Failed to verify authentication');
    }

    const verification = await verificationResponse.json();
    return verification;
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    throw error;
  }
}
