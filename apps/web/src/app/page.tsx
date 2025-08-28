'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <main className='min-h-screen bg-gray-50'>
      {/* Navigation */}
      <nav className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-bold text-gray-900'>Last Words</h1>
            </div>
            <div className='flex items-center space-x-4'>
              {status === 'loading' ? (
                <div className='text-gray-500'>Loading...</div>
              ) : session ? (
                <>
                  <span className='text-gray-700'>
                    Hello, {session.user?.name || session.user?.email}
                  </span>
                  <Link
                    href='/secrets'
                    className='bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700'
                  >
                    Access Secrets
                  </Link>
                  <Link
                    href='/setup-webauthn'
                    className='text-indigo-600 hover:text-indigo-500'
                  >
                    Setup WebAuthn
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className='text-gray-500 hover:text-gray-700'
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className='flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50'
                >
                  <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h1 className='text-4xl font-extrabold text-gray-900 sm:text-5xl'>
            Welcome to Last Words
          </h1>
          <p className='mt-4 text-xl text-gray-600'>
            Secure your digital legacy with advanced authentication
          </p>
        </div>

        <div className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='text-center'>
              <div className='text-3xl mb-4'>🔐</div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Secure Authentication
              </h3>
              <p className='text-gray-600'>
                Sign in with Google, then secure your account with WebAuthn
                passkeys
              </p>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='text-center'>
              <div className='text-3xl mb-4'>🛡️</div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                WebAuthn Protection
              </h3>
              <p className='text-gray-600'>
                Access your secrets only after WebAuthn verification for maximum
                security
              </p>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='text-center'>
              <div className='text-3xl mb-4'>📱</div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Passwordless Experience
              </h3>
              <p className='text-gray-600'>
                Use biometrics, security keys, or device authentication instead
                of passwords
              </p>
            </div>
          </div>
        </div>

        {session && (
          <div className='mt-12 text-center'>
            <div className='bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Your Account Status
              </h2>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-700'>Google Authentication</span>
                  <span className='text-green-600 font-semibold'>
                    ✅ Connected
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-700'>WebAuthn Setup</span>
                  <Link
                    href='/setup-webauthn'
                    className='text-indigo-600 hover:text-indigo-500 font-semibold'
                  >
                    Configure →
                  </Link>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-700'>Secrets Access</span>
                  <Link
                    href='/secrets'
                    className='text-indigo-600 hover:text-indigo-500 font-semibold'
                  >
                    Access →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
