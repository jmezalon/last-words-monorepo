'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignIn() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await signIn('credentials', {
      email,
      callbackUrl: '/',
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      window.location.href = '/';
    } else {
      setMessage(res?.error || 'Sign in failed');
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Sign in
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Enter your email to continue
          </p>
        </div>

        {(error || message) && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {message || `Authentication error: ${error}`}
          </div>
        )}

        <form onSubmit={onSubmit} className='space-y-4'>
          <input
            type='email'
            required
            placeholder='you@example.com'
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500'
          />
          <button
            type='submit'
            disabled={loading}
            className='w-full px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-900 disabled:opacity-50'
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
