'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { authenticateWebAuthn } from '@/lib/webauthn';
import SecretEditor from '@/components/secret-editor';

export default function SecretsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/secrets');
    }
  }, [status, router]);

  const handleWebAuthnAuth = async () => {
    if (!session?.user?.id) {
      setError('Please sign in first');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authenticateWebAuthn(session.user.id);

      if (result.verified) {
        setIsAuthenticated(true);
      } else {
        setError('WebAuthn authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSaveSecret = async (secretData: {
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    encryptedCIK: string;
    ciphertext: string;
    nonce: string;
  }) => {
    try {
      // TODO: Implement actual API call to save encrypted secret
      console.log('Saving secret:', secretData);
      
      // For now, just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Secret saved successfully');
    } catch (error) {
      console.error('Error saving secret:', error);
      throw error;
    }
  };

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='max-w-md w-full space-y-8 p-8'>
          <div className='text-center'>
            <h2 className='text-3xl font-extrabold text-gray-900'>
              🔐 Secrets Access
            </h2>
            <p className='mt-2 text-sm text-gray-600'>
              WebAuthn verification required to access your secrets
            </p>
          </div>

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
              {error}
            </div>
          )}

          <div className='text-center'>
            <button
              onClick={handleWebAuthnAuth}
              disabled={isAuthenticating}
              className='w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isAuthenticating
                ? 'Authenticating...'
                : 'Authenticate with Passkey'}
            </button>
          </div>

          <div className='text-center'>
            <p className='text-sm text-gray-500'>
              Don't have a passkey set up?{' '}
              <a
                href='/setup-webauthn'
                className='text-indigo-600 hover:text-indigo-500'
              >
                Set one up here
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h1 className='text-2xl font-bold text-gray-900'>
                🔐 Your Secrets
              </h1>
              <div className='flex items-center text-green-600'>
                <svg
                  className='w-5 h-5 mr-2'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                WebAuthn Verified
              </div>
            </div>

            <SecretEditor onSave={handleSaveSecret} />
          </div>
        </div>
      </div>
    </div>
  );
}
