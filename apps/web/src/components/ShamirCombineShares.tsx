/**
 * Shamir Share Combination Component
 * Allows beneficiaries to combine their shares to reconstruct the Release Key
 */

'use client';

import { useState } from 'react';
import { 
  decodeShamirShare, 
  combineShamirShares, 
  validateShareCombination,
  verifyShamirReconstruction,
  ShamirShare 
} from '../lib/shamir';

interface ShamirCombineSharesProps {
  willId: string;
  expectedHash?: string;
  onSharesCombined: (reconstructedKey: Uint8Array) => void;
  onError: (error: string) => void;
}

interface ShareInput {
  id: string;
  token: string;
  decoded?: ShamirShare & { shareData: number[] };
  error?: string;
}

export default function ShamirCombineShares({
  willId,
  expectedHash,
  onSharesCombined,
  onError
}: ShamirCombineSharesProps) {
  const [shares, setShares] = useState<ShareInput[]>([
    { id: '1', token: '' },
    { id: '2', token: '' },
    { id: '3', token: '' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [reconstructedKey, setReconstructedKey] = useState<Uint8Array | null>(null);

  const handleTokenChange = (index: number, token: string) => {
    const newShares = [...shares];
    newShares[index] = { ...newShares[index], token, decoded: undefined, error: undefined };
    // eslint-disable-next-line security/detect-object-injection
    setShares(newShares);
    setValidationErrors([]);
    setReconstructedKey(null);

    // Try to decode the token immediately
    if (token.trim()) {
      try {
        const decoded = decodeShamirShare(token.trim());
        const share = {
          ...decoded,
          // eslint-disable-next-line security/detect-object-injection
          shareData: decoded.shareData
        };
        if (share.willId !== willId) {
          newShares[index].error = 'This share is for a different will';
        } else {
          newShares[index].decoded = share;
        }
      } catch (error) {
        newShares[index].error = 'Invalid share format';
      }
      setShares([...newShares]);
    }
  };

  const handleCombineShares = async () => {
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      // Get all valid decoded shares
      const validShares = shares
        .filter(share => share.decoded && !share.error)
        .map(share => share.decoded!);

      // Validate the combination
      const validation = validateShareCombination(validShares);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Combine the shares
      const reconstructed = combineShamirShares(validShares);

      // Verify reconstruction if hash is provided
      if (expectedHash) {
        const isValid = await verifyShamirReconstruction(reconstructed, expectedHash);
        if (!isValid) {
          onError('Share combination failed verification. The shares may be invalid or corrupted.');
          return;
        }
      }

      setReconstructedKey(reconstructed);
      onSharesCombined(reconstructed);

    } catch (error) {
      onError(`Failed to combine shares: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearShares = () => {
    setShares([
      { id: '1', token: '' },
      { id: '2', token: '' },
      { id: '3', token: '' }
    ]);
    setValidationErrors([]);
    setReconstructedKey(null);
  };

  const validShareCount = shares.filter(share => share.decoded && !share.error).length;
  const canCombine = validShareCount >= 2 && !isProcessing;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Combine Shamir Shares
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Enter the share tokens you received via email. You need at least 2 out of 3 shares 
                to reconstruct the Release Key and access the legacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">
          Share Tokens ({validShareCount}/3 valid)
        </h4>

        {shares.map((share, index) => (
          <div key={share.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Share {index + 1} {share.decoded && !share.error && (
                <span className="text-green-600 text-xs ml-2">
                  ✓ Valid (Index: {share.decoded.shareIndex})
                </span>
              )}
            </label>
            <textarea
              value={share.token}
              onChange={(e) => handleTokenChange(index, e.target.value)}
              placeholder="Paste your share token here..."
              className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                share.error 
                  ? 'border-red-300 bg-red-50' 
                  : share.decoded 
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300'
              }`}
              rows={3}
              disabled={isProcessing}
            />
            {share.error && (
              <p className="text-sm text-red-600">{share.error}</p>
            )}
            {share.decoded && !share.error && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <p>Beneficiary: {share.decoded.beneficiaryId}</p>
                <p>Created: {new Date(share.decoded.createdAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Validation Errors
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleCombineShares}
          disabled={!canCombine}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            canCombine
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Combining Shares...
            </div>
          ) : (
            `Combine Shares (${validShareCount}/2 minimum)`
          )}
        </button>

        <button
          onClick={handleClearShares}
          disabled={isProcessing}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
        >
          Clear All
        </button>
      </div>

      {reconstructedKey && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Shares Successfully Combined!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                The Release Key has been reconstructed. You can now proceed to access the legacy.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Security Notes</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Share tokens are single-use and expire after successful reconstruction</li>
          <li>• Each share is encrypted and can only be used for its designated will</li>
          <li>• The reconstruction process is performed entirely in your browser</li>
          <li>• No sensitive data is transmitted to our servers during this process</li>
        </ul>
      </div>
    </div>
  );
}
