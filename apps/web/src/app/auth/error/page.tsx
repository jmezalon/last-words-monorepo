'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Check if your Google OAuth credentials are properly set up.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.';
      case 'OAuthCallback':
        return 'Error in handling the response from the OAuth provider.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth provider user in the database.';
      case 'EmailCreateAccount':
        return 'Could not create email provider user in the database.';
      case 'Callback':
        return 'Error in the OAuth callback.';
      case 'OAuthAccountNotLinked':
        return 'Email on the account already exists with different provider.';
      case 'EmailSignin':
        return 'Check your email address.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unexpected error occurred during authentication. This might be due to missing Google OAuth credentials.';
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Authentication Error
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Something went wrong during authentication
          </p>
        </div>

        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          <p className='font-medium'>Error: {error || 'Unknown error'}</p>
          <p className='mt-2 text-sm'>{getErrorMessage(error)}</p>
        </div>

        {!error || error === 'Configuration' || error === 'undefined' ? (
          <div className='bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded'>
            <p className='font-medium'>Setup Required:</p>
            <ul className='mt-2 text-sm list-disc list-inside space-y-1'>
              <li>Set up Google OAuth credentials in Google Cloud Console</li>
              <li>
                Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment
                variables
              </li>
              <li>Configure authorized redirect URIs</li>
              <li>Ensure NEXTAUTH_URL is set correctly</li>
            </ul>
          </div>
        ) : null}

        <div className='text-center space-y-4'>
          <Link
            href='/auth/signin'
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            Try Again
          </Link>

          <div>
            <Link
              href='/'
              className='text-sm text-indigo-600 hover:text-indigo-500'
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
