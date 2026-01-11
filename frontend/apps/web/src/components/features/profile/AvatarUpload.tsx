/**
 * Avatar Upload Component
 * Supports file upload and URL input
 * WCAG 2.1 AA compliant
 */
import React, { useRef, useState } from 'react';
import { Button } from '../../ui/Button';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (url: string) => void;
  initials: string;
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  initials,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        onAvatarChange(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
      setIsUploading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    if (url) {
      setPreviewUrl(url);
      onAvatarChange(url);
    } else {
      setPreviewUrl(null);
      onAvatarChange('');
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onAvatarChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="flex flex-col items-center">
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Profile avatar"
              className="w-32 h-32 rounded-full object-cover border-4"
              style={{ borderColor: '#A11692' }}
              onError={() => {
                setError('Failed to load image from URL');
                setPreviewUrl(null);
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Remove avatar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-semibold border-4"
            style={{ 
              background: 'linear-gradient(90deg, #A11692 0%, #A31694 100%)',
              borderColor: '#A11692'
            }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Upload Options */}
      <div className="space-y-3">
        {/* File Upload */}
        <div>
          <label
            htmlFor="avatar-file"
            className="block text-sm font-medium mb-2"
            style={{ color: '#514B50' }}
          >
            Upload Image
          </label>
          <input
            ref={fileInputRef}
            id="avatar-file"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            aria-label="Upload avatar image"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
            aria-label="Select image file"
          >
            {isUploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </div>

        {/* URL Input */}
        <div>
          <label
            htmlFor="avatar-url"
            className="block text-sm font-medium mb-2"
            style={{ color: '#514B50' }}
          >
            Or Enter Image URL
          </label>
          <input
            id="avatar-url"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            onChange={handleUrlChange}
            defaultValue={currentAvatarUrl}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 min-h-[44px]"
            style={{ '--tw-ring-color': '#A11692' } as React.CSSProperties}
            aria-label="Enter avatar image URL"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Supported formats: JPG, PNG, GIF. Max size: 5MB
      </p>
    </div>
  );
};
