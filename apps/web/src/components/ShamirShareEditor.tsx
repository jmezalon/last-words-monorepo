/**
 * Shamir Secret Sharing Configuration Component
 * Allows users to enable 2-of-3 Shamir sharing for Release Keys
 */

'use client';

import { useState, useEffect } from 'react';
// import { generateShamirShares, generateShareDistributionTokens } from '../lib/shamir';

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  priority: number;
}

interface ShamirShareEditorProps {
  beneficiaries: Beneficiary[];
  onShamirConfigChange: (config: ShamirConfig | null) => void;
  initialConfig?: ShamirConfig | null;
}

export interface ShamirConfig {
  enabled: boolean;
  selectedBeneficiaries: string[]; // Array of 3 beneficiary IDs
  distributionTokens?: Array<{
    beneficiaryId: string;
    email: string;
    token: string;
    shareIndex: number;
  }>;
  releaseKeyHash?: string;
}

export default function ShamirShareEditor({ 
  beneficiaries, 
  onShamirConfigChange, 
  initialConfig 
}: ShamirShareEditorProps) {
  const [shamirEnabled, setShamirEnabled] = useState(initialConfig?.enabled || false);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(
    initialConfig?.selectedBeneficiaries || []
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Filter to only show primary beneficiaries (top 3 by priority)
  const primaryBeneficiaries = beneficiaries
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  useEffect(() => {
    if (shamirEnabled) {
      validateConfiguration();
    } else {
      setErrors([]);
      onShamirConfigChange(null);
    }
  }, [shamirEnabled, selectedBeneficiaries]);

  const validateConfiguration = () => {
    const newErrors: string[] = [];

    if (primaryBeneficiaries.length < 3) {
      newErrors.push('You need at least 3 beneficiaries to enable Shamir Secret Sharing');
    }

    if (selectedBeneficiaries.length !== 3) {
      newErrors.push('Exactly 3 beneficiaries must be selected for 2-of-3 sharing');
    }

    // Check for duplicate selections
    if (new Set(selectedBeneficiaries).size !== selectedBeneficiaries.length) {
      newErrors.push('Cannot select the same beneficiary multiple times');
    }

    // Validate email addresses
    const selectedEmails = selectedBeneficiaries
      .map(id => primaryBeneficiaries.find(b => b.id === id)?.email)
      .filter(Boolean);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = selectedEmails.filter(email => !emailRegex.test(email!));
    
    if (invalidEmails.length > 0) {
      newErrors.push('All selected beneficiaries must have valid email addresses');
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      const config: ShamirConfig = {
        enabled: true,
        selectedBeneficiaries,
      };
      onShamirConfigChange(config);
    } else {
      onShamirConfigChange(null);
    }
  };

  const handleBeneficiaryToggle = (beneficiaryId: string) => {
    if (selectedBeneficiaries.includes(beneficiaryId)) {
      setSelectedBeneficiaries(prev => prev.filter(id => id !== beneficiaryId));
    } else if (selectedBeneficiaries.length < 3) {
      setSelectedBeneficiaries(prev => [...prev, beneficiaryId]);
    }
  };

  const handleSelectAll = () => {
    if (primaryBeneficiaries.length >= 3) {
      setSelectedBeneficiaries(primaryBeneficiaries.slice(0, 3).map(b => b.id));
    }
  };

  const handleClearAll = () => {
    setSelectedBeneficiaries([]);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg border">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="shamir-enabled"
          checked={shamirEnabled}
          onChange={(e) => setShamirEnabled(e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <div className="flex-1">
          <label htmlFor="shamir-enabled" className="text-sm font-medium text-gray-900">
            Enable Shamir Secret Sharing (2-of-3)
          </label>
          <p className="text-sm text-gray-600 mt-1">
            Distribute your Release Key among 3 beneficiaries. Any 2 of them can combine their shares 
            to access your legacy. This provides redundancy and prevents single points of failure.
          </p>
        </div>
      </div>

      {shamirEnabled && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  How Shamir Secret Sharing Works
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your Release Key is split into 3 encrypted shares</li>
                    <li>Each share is sent to a different beneficiary via secure email</li>
                    <li>Any 2 shares can reconstruct the original Release Key</li>
                    <li>No single beneficiary can access your legacy alone</li>
                    <li>If one beneficiary loses their share, the other two can still access it</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                Select 3 Beneficiaries ({selectedBeneficiaries.length}/3)
              </h4>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={primaryBeneficiaries.length < 3}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  Select Top 3
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {primaryBeneficiaries.map((beneficiary) => (
                <div
                  key={beneficiary.id}
                  className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedBeneficiaries.includes(beneficiary.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleBeneficiaryToggle(beneficiary.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedBeneficiaries.includes(beneficiary.id)}
                    onChange={() => handleBeneficiaryToggle(beneficiary.id)}
                    disabled={!selectedBeneficiaries.includes(beneficiary.id) && selectedBeneficiaries.length >= 3}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{beneficiary.name}</p>
                        <p className="text-sm text-gray-600">{beneficiary.email}</p>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Priority {beneficiary.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {primaryBeneficiaries.length < 3 && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ You need at least 3 beneficiaries to use Shamir Secret Sharing. 
                Please add more beneficiaries first.
              </p>
            )}
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Configuration Errors
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {shamirEnabled && selectedBeneficiaries.length === 3 && errors.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Shamir Configuration Ready
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    Your Release Key will be split among the 3 selected beneficiaries. 
                    Shares will be distributed via secure email when you save your will.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
