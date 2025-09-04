'use client';

import { useState } from 'react';

interface SecretData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  encryptedCIK: string;
  ciphertext: string;
  nonce: string;
}

interface SecretEditorProps {
  onSave?: (secretData: SecretData) => void;
}

export default function SecretEditor({ onSave }: SecretEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [tags, setTags] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title || !content || !password) {
      console.warn('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // For now, just call the onSave callback with the data
      // TODO: Implement client-side encryption
      const secretData = {
        title,
        description,
        content,
        category,
        tags,
        // Placeholder for encrypted data
        encryptedCIK: 'placeholder_encrypted_cik',
        ciphertext: 'placeholder_ciphertext',
        nonce: 'placeholder_nonce'
      };

      if (onSave) {
        await onSave(secretData);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setContent('');
      setPassword('');
      setTags([]);
      
      console.log('Secret saved successfully!');
    } catch (error) {
      console.error('Error saving secret:', error);
      console.error('Failed to save secret');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Secret</h2>
      
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Bank Account Password"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of this secret"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Personal">Personal</option>
            <option value="Financial">Financial</option>
            <option value="Digital">Digital</option>
            <option value="Medical">Medical</option>
            <option value="Legal">Legal</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a tag and press Enter"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secret Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your secret information here..."
          />
        </div>

        {/* Password for encryption */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Encryption Password *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a strong password for encryption"
          />
          <p className="text-xs text-gray-500 mt-1">
            This password will be used to encrypt your secret. Make sure to remember it!
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Secret'}
        </button>
      </div>
    </div>
  );
}
