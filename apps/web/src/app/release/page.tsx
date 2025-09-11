'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReleaseAccessForm } from '@/components/release/ReleaseAccessForm';
import { SecretsList } from '@/components/release/SecretsList';
import { DownloadPackage } from '@/components/release/DownloadPackage';

export interface DecryptedSecret {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content: string;
  createdAt: string;
}

export default function ReleasePage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'access' | 'secrets' | 'download'>('access');
  const [secrets, setSecrets] = useState<DecryptedSecret[]>([]);
  const [combinedKey, setCombinedKey] = useState<string>('');

  // Get URL parameters for beneficiary access
  const willId = searchParams.get('willId');
  const beneficiaryId = searchParams.get('beneficiaryId');

  const handleAccessGranted = (decryptedSecrets: DecryptedSecret[], key: string) => {
    setSecrets(decryptedSecrets);
    setCombinedKey(key);
    setStep('secrets');
  };

  const handleProceedToDownload = () => {
    setStep('download');
  };

  if (!willId || !beneficiaryId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access Link</h1>
            <p className="text-gray-600 mb-4">
              This release access link is invalid or has expired. Please contact the will administrator for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md">
          {/* Progress indicator */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'access' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  1
                </div>
                <span className={`text-sm font-medium ${
                  step === 'access' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  Access Verification
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'secrets' ? 'bg-blue-600 text-white' : 
                  step === 'download' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  2
                </div>
                <span className={`text-sm font-medium ${
                  step === 'secrets' ? 'text-blue-600' : 
                  step === 'download' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  View Secrets
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'download' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  3
                </div>
                <span className={`text-sm font-medium ${
                  step === 'download' ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  Secure Download
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'access' && (
              <ReleaseAccessForm
                willId={willId}
                beneficiaryId={beneficiaryId}
                onAccessGranted={handleAccessGranted}
              />
            )}

            {step === 'secrets' && (
              <SecretsList
                secrets={secrets}
                onProceedToDownload={handleProceedToDownload}
              />
            )}

            {step === 'download' && (
              <DownloadPackage
                secrets={secrets}
                combinedKey={combinedKey}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
