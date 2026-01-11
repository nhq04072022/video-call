/**
 * Session Share Page - Display session code for sharing
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useSessionStore } from '../stores/sessionStore';
import { useAuth } from '../hooks/useAuth';

export const SessionSharePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const [copied, setCopied] = useState(false);

  // Redirect if no session ID
  useEffect(() => {
    if (!currentSessionId) {
      navigate('/sessions');
    }
  }, [currentSessionId, navigate]);

  // Use full session ID as share code (can be shortened later if needed)
  const shareCode = currentSessionId || '';

  const shareUrl = currentSessionId 
    ? `${window.location.origin}/sessions/join-code?code=${currentSessionId}`
    : '';

  const handleCopyCode = async () => {
    if (shareCode) {
      try {
        await navigator.clipboard.writeText(shareCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  const handleCopyUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  const handleJoinSession = () => {
    if (currentSessionId) {
      // Navigate directly to active session page (like Google Meet)
      // SessionActivePage will auto-connect to LiveKit on mount
      navigate('/sessions/active');
    }
  };

  if (!currentSessionId) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto wave-background">
        <div className="bg-white rounded-card-lg shadow-2xl p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-primary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h1 className="text-3xl font-heading text-text-grey mb-2">
              Session Started!
            </h1>
            <p className="text-gray-600">
              Share this code with your participant to join the session
            </p>
          </div>

          {/* Session Code */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Code
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="bg-gradient-to-r from-primary-purple to-primary-purple-accent text-white text-lg font-bold text-center py-6 px-8 rounded-card font-mono break-all">
                  {shareCode}
                </div>
              </div>
              <Button
                onClick={handleCopyCode}
                variant="secondary"
                className="whitespace-nowrap"
                aria-label={copied ? 'Code copied!' : 'Copy code'}
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share URL */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or share this link
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-card px-4 py-3 text-sm text-gray-700 break-all">
                {shareUrl}
              </div>
              <Button
                onClick={handleCopyUrl}
                variant="secondary"
                className="whitespace-nowrap"
                aria-label={copied ? 'URL copied!' : 'Copy URL'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-card p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How to join:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Share the session code or link with your participant</li>
              <li>They can enter the code or click the link to join</li>
              <li>Both participants will be connected when ready</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleJoinSession}
              variant="primary"
              size="lg"
              className="flex-1"
            >
              Join Session Now
            </Button>
            <Button
              onClick={() => navigate('/sessions')}
              variant="secondary"
              className="flex-1"
            >
              Back to Sessions
            </Button>
          </div>
        </div>
      </div>
  );
};

