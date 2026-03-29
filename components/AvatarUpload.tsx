'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AvatarUpload() {
  const { data: session } = useSession();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clear messages after 5 seconds
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Avatar updated successfully!');
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your custom avatar?')) {
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Avatar removed successfully!');
        setPreview(null);
      } else {
        setError(result.error || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Remove error:', error);
      setError('Failed to remove avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-[var(--n-muted)]">
          Please sign in to upload an avatar.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl mb-8">
        Custom Avatar
      </h1>

      {/* Current Avatar */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Current Avatar</h2>
        <div className="flex items-center space-x-6">
          <img
            src={session.user?.image || '/default-avatar.png'}
            alt="Current avatar"
            className="w-24 h-24 rounded-full border-4 border-[var(--n-border)]"
          />
          <div>
            <p className="font-medium text-[var(--n-text)]">
              {session.user?.name || session.user?.githubLogin}
            </p>
            <p className="text-sm text-[var(--n-muted)]">
              {session.user?.image ? 'Custom avatar' : 'Default avatar'}
            </p>
            {session.user?.image && (
              <button
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Avatar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Upload New Avatar</h2>
        
        {/* Upload Guidelines */}
        <div className="mb-6 p-4 bg-[var(--n-void)] rounded-lg">
          <h3 className="font-medium text-[var(--n-text)] mb-2">Guidelines:</h3>
          <ul className="text-sm text-[var(--n-muted)] space-y-1">
            <li>• Image files only (JPG, PNG, GIF, WebP)</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Recommended size: 512x512 pixels</li>
            <li>• Square images work best</li>
            <li>• Appropriate content only</li>
          </ul>
        </div>

        {/* File Input */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="block w-full px-4 py-3 bg-[var(--n-void)] border-2 border-dashed border-[var(--n-border)] rounded-lg text-center cursor-pointer hover:border-[var(--n-accent)] transition-colors"
          >
            <div className="space-y-2">
              <div className="text-4xl">📷</div>
              <div className="text-[var(--n-text)] font-medium">
                Click to upload or drag and drop
              </div>
              <div className="text-sm text-[var(--n-muted)]">
                JPG, PNG, GIF, WebP up to 5MB
              </div>
            </div>
          </label>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-6">
            <h3 className="font-medium text-[var(--n-text)] mb-3">Preview:</h3>
            <div className="flex items-center space-x-4">
              <img
                src={preview}
                alt="Avatar preview"
                className="w-20 h-20 rounded-full border-2 border-[var(--n-accent)]"
              />
              <div className="flex-1">
                <p className="text-sm text-[var(--n-muted)]">
                  This is how your avatar will appear.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-600 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        {preview && (
          <div className="flex space-x-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-[var(--n-accent)] text-white rounded-lg hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-[var(--n-accent)] h-full transition-all duration-300" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-[var(--n-muted)] mt-2 text-center">
              Uploading your avatar...
            </p>
          </div>
        )}
      </div>

      {/* Additional Options */}
      <div className="mt-8 p-6 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Avatar Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-[var(--n-void)] rounded-lg hover:bg-[var(--n-accent)]/10 transition-colors">
            <div className="text-2xl mb-2">🎨</div>
            <p className="font-medium text-[var(--n-text)]">Generate Avatar</p>
            <p className="text-sm text-[var(--n-muted)]">AI-powered avatar creation</p>
          </button>
          <button className="p-4 bg-[var(--n-void)] rounded-lg hover:bg-[var(--n-accent)]/10 transition-colors">
            <div className="text-2xl mb-2">🔄</div>
            <p className="font-medium text-[var(--n-text)]">Reset to Default</p>
            <p className="text-sm text-[var(--n-muted)]">Use GitHub profile picture</p>
          </button>
        </div>
      </div>
    </div>
  );
}
