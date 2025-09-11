'use client';

import React, { useState } from 'react';

import { createSecureDownloadPackage } from '@/lib/release-crypto';

interface DecryptedSecret {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content: string;
  createdAt: string;
}

interface DownloadPackageProps {
  secrets: DecryptedSecret[];
}

export function DownloadPackage({ secrets }: DownloadPackageProps) {
  const [downloadPassword, setDownloadPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleGeneratePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate passwords match
      if (downloadPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (downloadPassword.length < 8) {
        throw new Error('Download password must be at least 8 characters');
      }

      // Create encrypted package using the release crypto library
      const packageData = await createSecureDownloadPackage(secrets, downloadPassword);
      
      // Create download URL
      const blob = new Blob([JSON.stringify(packageData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      // Set expiration time (24 hours from now)
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setExpiresAt(expirationTime.toLocaleString());

      // Generate download package via API
      const response = await fetch('/api/release/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secrets,
          downloadPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate download package');
      }

      const result = await response.json();
      setDownloadUrl(result.downloadUrl);
      setExpiresAt(result.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate download package');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDownload = () => {
    // Create a JSON file with all the secrets for direct download
    const packageData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalSecrets: secrets.length,
        categories: [...new Set(secrets.map(s => s.category).filter(Boolean))],
        note: 'This is an unencrypted export of your digital legacy. Please store securely.',
      },
      secrets: secrets.map(secret => ({
        title: secret.title,
        description: secret.description,
        category: secret.category,
        tags: secret.tags,
        content: secret.content,
        createdAt: secret.createdAt,
      })),
    };

    const dataStr = JSON.stringify(packageData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital-legacy-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatExpiryTime = (expiryString: string) => {
    const expiryDate = new Date(expiryString);
    return expiryDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Download</h2>
        <p className="text-gray-600">
          Create a secure, encrypted package of the selected digital legacy items
        </p>
      </div>

      {!downloadUrl ? (
        <div className="space-y-6">
          {/* Package Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Package Contents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total Items:</span>
                <span className="ml-2 text-gray-600">{secrets.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Categories:</span>
                <span className="ml-2 text-gray-600">
                  {new Set(secrets.map(s => s.category).filter(Boolean)).size || 'None'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Export Date:</span>
                <span className="ml-2 text-gray-600">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Download Options</h3>
            
            {/* Encrypted Package Option */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Encrypted ZIP Package</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Creates a password-protected ZIP file that expires in 24 hours
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                  Recommended
                </span>
              </div>

              <form onSubmit={handleGeneratePackage} className="space-y-4">
                <div>
                  <label htmlFor="downloadPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Download Password
                  </label>
                  <input
                    type="password"
                    id="downloadPassword"
                    value={downloadPassword}
                    onChange={(e) => setDownloadPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a strong password for the download"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your download password"
                    required
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !downloadPassword || !confirmPassword}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Package...
                    </div>
                  ) : (
                    'Generate Encrypted Package'
                  )}
                </button>
              </form>
            </div>

            {/* Direct Download Option */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Direct JSON Download</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Downloads an unencrypted JSON file immediately
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">
                  Less Secure
                </span>
              </div>

              <button
                onClick={handleDirectDownload}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Download JSON File
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Download Ready */
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex justify-center mb-4">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Secure Package Ready
            </h3>
            <p className="text-sm text-green-700">
              Your encrypted package has been generated and is ready for download.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h4 className="font-medium text-gray-900 mb-2">Important Information</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• The download link expires on {formatExpiryTime(expiresAt)}</li>
              <li>• Use the password you created to extract the ZIP file</li>
              <li>• Store the downloaded file in a secure location</li>
              <li>• This download link can only be used once</li>
            </ul>
          </div>

          <div className="space-y-3">
            <a
              href={downloadUrl}
              className="inline-block w-full py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Download Encrypted Package
            </a>
            
            <button
              onClick={handleDirectDownload}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Also Download as JSON (Backup)
            </button>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
            <p className="mt-1 text-sm text-blue-700">
              All decryption was performed locally in your browser. The original encrypted data remains secure on the server.
              Remember to store your downloaded files securely and delete them from shared devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
