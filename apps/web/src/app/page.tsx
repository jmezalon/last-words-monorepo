"use client"

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Last Words</h1>
            </div>
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="text-gray-500">Loading...</div>
              ) : session ? (
                <>
                  <span className="text-gray-700">Hello, {session.user?.name || session.user?.email}</span>
                  <Link
                    href="/secrets"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Access Secrets
                  </Link>
                  <Link
                    href="/setup-webauthn"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Setup WebAuthn
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Welcome to Last Words
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Secure your digital legacy with advanced authentication
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure Authentication
              </h3>
              <p className="text-gray-600">
                Sign in with Google or Apple, then secure your account with WebAuthn passkeys
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                WebAuthn Protection
              </h3>
              <p className="text-gray-600">
                Access your secrets only after WebAuthn verification for maximum security
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Passwordless Experience
              </h3>
              <p className="text-gray-600">
                Use biometrics, security keys, or device authentication instead of passwords
              </p>
            </div>
          </div>
        </div>

        {session && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Account Status
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">OAuth Authentication</span>
                  <span className="text-green-600 font-semibold">✅ Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">WebAuthn Setup</span>
                  <Link
                    href="/setup-webauthn"
                    className="text-indigo-600 hover:text-indigo-500 font-semibold"
                  >
                    Configure →
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Secrets Access</span>
                  <Link
                    href="/secrets"
                    className="text-indigo-600 hover:text-indigo-500 font-semibold"
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
  )
}
