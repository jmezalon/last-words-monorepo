'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
// import { startRegistration } from '@simplewebauthn/browser';

import { registerWebAuthn } from '@/lib/webauthn';

export function WebAuthnSetup() {
  const { data: session } = useSession();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!session?.user?.id) {
      setError('Please sign in first');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      // Get JWT token from NextAuth session
      const tokenResponse = await fetch('/api/auth/token');
      const { token } = await tokenResponse.json();

      const result = await registerWebAuthn(token);

      if (result.verified) {
        setIsRegistered(true);
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!session) {
    return (
      <div className='text-center p-4'>
        <p className='text-gray-600'>Please sign in to set up WebAuthn</p>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className='text-center p-4'>
        <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded'>
          ✅ WebAuthn (Passkey) successfully registered!
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto p-6 bg-white rounded-lg shadow-md'>
      <h3 className='text-lg font-semibold mb-4'>Set Up WebAuthn (Passkey)</h3>
      <p className='text-gray-600 mb-6'>
        Register a passkey to securely access your secrets without passwords.
      </p>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={isRegistering}
        className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isRegistering ? 'Registering...' : 'Register Passkey'}
      </button>
    </div>
  );
}
