'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { WebAuthnSetup } from '@/components/webauthn-setup';

export default function SetupWebAuthnPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/setup-webauthn');
    }
  }, [status, router]);

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

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-2xl mx-auto'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-extrabold text-gray-900'>
            Set Up WebAuthn Security
          </h1>
          <p className='mt-4 text-lg text-gray-600'>
            Secure your account with passwordless authentication using passkeys
          </p>
        </div>

        <WebAuthnSetup />

        <div className='mt-8 text-center'>
          <a href='/' className='text-indigo-600 hover:text-indigo-500'>
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
