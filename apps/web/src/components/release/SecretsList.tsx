'use client';

import { useState } from 'react';

interface DecryptedSecret {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content: string;
  createdAt: string;
}

interface SecretsListProps {
  secrets: DecryptedSecret[];
  onProceedToDownload: () => void;
}

export function SecretsList({ secrets, onProceedToDownload }: SecretsListProps) {
  const [selectedSecrets, setSelectedSecrets] = useState<Set<string>>(new Set(secrets.map(s => s.id)));
  const [expandedSecret, setExpandedSecret] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter secrets based on search and category
  const filteredSecrets = secrets.filter(secret => {
    const matchesSearch = !searchTerm || 
      secret.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      secret.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      secret.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || secret.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(secrets.map(s => s.category).filter(Boolean))];

  const toggleSecretSelection = (secretId: string) => {
    const newSelected = new Set(selectedSecrets);
    if (newSelected.has(secretId)) {
      newSelected.delete(secretId);
    } else {
      newSelected.add(secretId);
    }
    setSelectedSecrets(newSelected);
  };

  const toggleAllSecrets = () => {
    if (selectedSecrets.size === filteredSecrets.length) {
      setSelectedSecrets(new Set());
    } else {
      setSelectedSecrets(new Set(filteredSecrets.map(s => s.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Digital Legacy Contents</h2>
        <p className="text-gray-600">
          Review and select the items you want to download. Found {secrets.length} item{secrets.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search secrets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Select All Toggle */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-md">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedSecrets.size === filteredSecrets.length && filteredSecrets.length > 0}
            onChange={toggleAllSecrets}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            Select All ({filteredSecrets.length} items)
          </span>
        </label>
        <span className="text-sm text-gray-500">
          {selectedSecrets.size} selected for download
        </span>
      </div>

      {/* Secrets List */}
      <div className="space-y-4">
        {filteredSecrets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No secrets match your search criteria.</p>
          </div>
        ) : (
          filteredSecrets.map((secret) => (
            <div
              key={secret.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedSecrets.has(secret.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedSecrets.has(secret.id)}
                    onChange={() => toggleSecretSelection(secret.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {secret.title}
                    </h3>
                    {secret.description && (
                      <p className="text-sm text-gray-600 mb-2">{secret.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                      {secret.category && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {secret.category}
                        </span>
                      )}
                      <span>Created: {formatDate(secret.createdAt)}</span>
                    </div>
                    {secret.tags && secret.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {secret.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2">
                      {expandedSecret === secret.id ? (
                        <div className="bg-gray-50 p-3 rounded border">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                            {secret.content}
                          </pre>
                          <button
                            onClick={() => setExpandedSecret(null)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Show less
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600">
                            {truncateContent(secret.content)}
                          </p>
                          {secret.content.length > 150 && (
                            <button
                              onClick={() => setExpandedSecret(secret.id)}
                              className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              Show more
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-gray-600">
          {selectedSecrets.size} of {secrets.length} items selected
        </div>
        <button
          onClick={onProceedToDownload}
          disabled={selectedSecrets.size === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Secure Download
        </button>
      </div>
    </div>
  );
}
