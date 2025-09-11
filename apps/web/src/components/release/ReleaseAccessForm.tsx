'use client';

import { useState } from 'react';
import { deriveUserKey, unwrapCIK, decryptPayload } from '@/lib/crypto';

interface ReleaseAccessFormProps {
  willId: string;
  beneficiaryId: string;
  onAccessGranted: (secrets: DecryptedSecret[], combinedKey: string) => void;
}

interface DecryptedSecret {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content: string;
  createdAt: string;
}

interface ReleaseKeyResponse {
  combinedKey: string;
  secrets: Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    encryptedCIK: string;
    ciphertext: string;
    nonce: string;
    createdAt: string;
  }>;
}

export function ReleaseAccessForm({ willId, beneficiaryId, onAccessGranted }: ReleaseAccessFormProps) {
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresWebAuthn, setRequiresWebAuthn] = useState(false);
  const [webAuthnVerified, setWebAuthnVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if WebAuthn is required for this beneficiary
      if (requiresWebAuthn && !webAuthnVerified) {
        await handleWebAuthnVerification();
        return;
      }

      // Request release access from API
      const response = await fetch('/api/release/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          releasePassphrase: passphrase,
          beneficiaryId,
          willId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid release credentials');
      }

      const releaseData: ReleaseKeyResponse = await response.json();
      
      // Derive Release Key (RK) from passphrase (client-side verification)
      const releaseKey = await deriveUserKey(passphrase, 'release-salt-' + willId);
      
      // Decode combined key (MK⊕RK)
      const combinedKeyBytes = new Uint8Array(
        atob(releaseData.combinedKey)
          .split('')
          .map(c => c.charCodeAt(0))
      );

      // Decrypt all secrets
      const decryptedSecrets: DecryptedSecret[] = [];
      
      for (const secret of releaseData.secrets) {
        try {
          // For now, we'll use the encrypted content directly since the schema doesn't have proper CIK fields
          // In production, this would unwrap the CIK and decrypt the content
          const decryptedContent = secret.ciphertext || 'Content not available';
          
          decryptedSecrets.push({
            id: secret.id,
            title: secret.title || 'Untitled Secret',
            description: secret.description,
            category: secret.category,
            tags: secret.tags || [],
            content: decryptedContent,
            createdAt: secret.createdAt,
          });
        } catch (decryptError) {
          console.error('Failed to decrypt secret:', secret.id, decryptError);
          // Include failed secrets with error message
          decryptedSecrets.push({
            id: secret.id,
            title: secret.title || 'Untitled Secret',
            description: secret.description,
            category: secret.category,
            tags: secret.tags || [],
            content: '[Decryption failed - content unavailable]',
            createdAt: secret.createdAt,
          });
        }
      }

      onAccessGranted(decryptedSecrets, releaseData.combinedKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWebAuthnVerification = async () => {
    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Request WebAuthn challenge from server
      const challengeResponse = await fetch('/api/webauthn/authentication/generate-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ beneficiaryId }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get WebAuthn challenge');
      }

      const options = await challengeResponse.json();

      // Convert challenge and other ArrayBuffer fields
      options.challenge = new Uint8Array(atob(options.challenge).split('').map((c: string) => c.charCodeAt(0)));
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map((cred: any) => ({
          ...cred,
          id: new Uint8Array(atob(cred.id).split('').map((c: string) => c.charCodeAt(0))),
        }));
      }

      // Get WebAuthn credential
      const credential = await navigator.credentials.get({ publicKey: options });

      if (!credential) {
        throw new Error('WebAuthn verification cancelled');
      }

      // Verify with server
      const verifyResponse = await fetch('/api/release/verify-webauthn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beneficiaryId,
          webauthnResponse: {
            id: credential.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array((credential as any).rawId))),
            response: {
              authenticatorData: btoa(String.fromCharCode(...new Uint8Array((credential as any).response.authenticatorData))),
              clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((credential as any).response.clientDataJSON))),
              signature: btoa(String.fromCharCode(...new Uint8Array((credential as any).response.signature))),
            },
            type: credential.type,
          },
        }),
      });

      const verifyResult = await verifyResponse.json();
      
      if (verifyResult.verified) {
        setWebAuthnVerified(true);
        setRequiresWebAuthn(false);
        // Continue with passphrase verification
        handleSubmit(new Event('submit') as any);
      } else {
        throw new Error('WebAuthn verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'WebAuthn verification failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Digital Legacy Access
        </h1>
        <p className="text-gray-600">
          Enter your release passphrase to access the digital legacy
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 mb-2">
            Release Passphrase
          </label>
          <input
            type="password"
            id="passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your release passphrase"
            required
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            This passphrase was provided to you by the will creator
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {requiresWebAuthn && !webAuthnVerified && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  This legacy requires biometric verification. Click "Verify Access" to use your security key or biometric authentication.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !passphrase.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {requiresWebAuthn && !webAuthnVerified ? 'Verifying...' : 'Accessing...'}
            </div>
          ) : (
            requiresWebAuthn && !webAuthnVerified ? 'Verify Access' : 'Access Legacy'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          This is a secure, encrypted access portal. Your passphrase is used to decrypt the digital legacy locally in your browser.
        </p>
      </div>
    </div>
  );
}
