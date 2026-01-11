'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui';
import { useLiveKit } from '@/contexts/LiveKitContext';
import { useSession } from '@/hooks/useSession';
import { LocalParticipant, Track } from 'livekit-client';
import { ChatPanel } from './ChatPanel';

interface ActiveSessionProps {
  onEnd: () => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({ onEnd }) => {
  const {
    participants,
    room,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isScreenShareEnabled,
    disconnect,
  } = useLiveKit();
  const { endSession } = useSession();
  const [duration, setDuration] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const screenShareRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Define isLocalParticipant before using it
  const isLocalParticipant = useCallback((participant: any) => {
    return participant instanceof LocalParticipant || participant === room?.localParticipant;
  }, [room]);

  // Force update when screen share state changes
  useEffect(() => {
    if (isScreenShareEnabled) {
      const timer = setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isScreenShareEnabled]);

  // Attach video tracks and screen share
  useEffect(() => {
    const audioElements: HTMLAudioElement[] = [];
    
    participants.forEach((participant) => {
      const isLocal = isLocalParticipant(participant);
      
      // Handle camera video tracks (not screen share)
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.source !== Track.Source.ScreenShare) {
          const videoElement = videoRefs.current.get(participant.identity);
          
          // For remote participants, check if subscribed
          if (!isLocal && !publication.isSubscribed) {
            console.log(`Video track not subscribed for ${participant.identity}`);
            return;
          }
          
          // If track exists and is subscribed (or local), attach it
          if (publication.track && (isLocal || publication.isSubscribed)) {
            if (videoElement) {
              // Detach any existing track first
              if (videoElement.srcObject) {
                videoElement.srcObject = null;
              }
              publication.track.attach(videoElement);
              console.log(`Video track attached for ${participant.identity} (local: ${isLocal}, subscribed: ${publication.isSubscribed})`);
            } else {
              console.warn(`Video element not found for ${participant.identity}`);
              // Force re-render to create the element
              requestAnimationFrame(() => {
                setForceUpdate((prev) => prev + 1);
              });
            }
          }
        }
      });

      // Handle screen share tracks (for both local and remote)
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.track && publication.source === Track.Source.ScreenShare) {
          const screenShareKey = `${participant.identity}-screen`;
          const screenElement = screenShareRefs.current.get(screenShareKey);
          if (screenElement) {
            // Detach any existing track first
            const existingTracks = screenElement.srcObject?.getTracks() || [];
            existingTracks.forEach((track: MediaStreamTrack) => track.stop());
            screenElement.srcObject = null;
            
            // Attach the new track
            publication.track.attach(screenElement);
            console.log(`Screen share attached for ${participant.identity} (local: ${isLocal})`);
          } else {
            console.warn(`Screen share element not found for ${participant.identity}`);
            // Force re-render to create the element
            requestAnimationFrame(() => {
              setForceUpdate((prev) => prev + 1);
            });
          }
        }
      });
      
      // Handle audio tracks (including screen share audio)
      participant.audioTrackPublications.forEach((publication) => {
        if (publication.track && publication.track.mediaStreamTrack) {
          const audioElement = document.createElement('audio');
          audioElement.autoplay = true;
          audioElement.playsInline = true;
          audioElement.muted = false;
          publication.track.attach(audioElement);
          document.body.appendChild(audioElement);
          audioElements.push(audioElement);
        }
      });
    });
    
    // Cleanup audio elements on unmount
    return () => {
      audioElements.forEach((el) => {
        el.remove();
      });
    };
  }, [participants, isLocalParticipant, forceUpdate]);

  const handleEndSession = async () => {
    try {
      await endSession();
      await disconnect();
      onEnd();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Find active screen share (check both local and remote participants)
  const activeScreenShare = participants.find((participant) => {
    const isLocal = isLocalParticipant(participant);
    return Array.from(participant.videoTrackPublications.values()).some(
      (pub) => {
        // For local participant, check if track exists (don't need isSubscribed)
        // For remote participants, check if subscribed
        if (pub.source === Track.Source.ScreenShare) {
          return isLocal ? pub.track !== undefined : pub.isSubscribed;
        }
        return false;
      }
    );
  });

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Header Bar */}
      <div className="bg-primary-purple text-white px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-purple font-bold text-lg">M</span>
            </div>
            <span className="font-semibold text-base sm:text-lg">Project M&M</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium">Session Timer:</span>
            <span className="font-mono text-sm sm:text-base">{formatDuration(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs sm:text-sm">Session started successfully</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Area with Wave Background */}
        <div className={`flex-1 ${
          showChat && showAIInsights ? 'mr-0 lg:mr-[640px]' : 
          showChat ? 'mr-0 sm:mr-96 lg:mr-80' : 
          showAIInsights ? 'mr-0 lg:mr-80' : ''
        } transition-all duration-300 wave-pattern bg-gray-50`}>
          {/* Screen Share Display (if active) */}
          {activeScreenShare && (
            <div className="h-full relative bg-gray-900 p-2 sm:p-4">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <video
                  ref={(el) => {
                    if (el) {
                      const screenShareKey = `${activeScreenShare.identity}-screen`;
                      screenShareRefs.current.set(screenShareKey, el);
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-sm sm:px-3">
                  {activeScreenShare.name || 'Unknown'} is sharing screen
                </div>
              </div>
            </div>
          )}

          {/* Video Grid */}
          {!activeScreenShare && (
            <div className="h-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
              {participants.length > 0 ? (
                participants.map((participant) => {
                  const isLocal = isLocalParticipant(participant);
                  
                  // Check if participant has video track
                  const hasVideoTrack = Array.from(participant.videoTrackPublications.values())
                    .some(pub => 
                      pub.source === Track.Source.Camera && 
                      pub.track && 
                      (isLocal || pub.isSubscribed)
                    );
                  
                  // Show avatar if: local and video disabled, OR remote and no video track
                  const showAvatar = (isLocal && !isVideoEnabled) || (!isLocal && !hasVideoTrack);
                  
                  const participantName = isLocal ? 'You' : (participant.name || 'Unknown');
                  const participantRole = isLocal ? 'Mentorship Provider' : 'Patient';
                  
                  return (
                    <div
                      key={participant.identity}
                      className="relative bg-white rounded-xl overflow-hidden shadow-lg"
                    >
                      <video
                        ref={(el) => {
                          if (el) {
                            videoRefs.current.set(participant.identity, el);
                            // Force update to attach track if element is now available
                            if (hasVideoTrack) {
                              setTimeout(() => setForceUpdate((prev) => prev + 1), 100);
                            }
                          }
                        }}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover ${showAvatar ? 'hidden' : ''}`}
                      />
                      {showAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-purple flex items-center justify-center text-white text-2xl sm:text-3xl font-semibold">
                            {participant.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        </div>
                      )}
                      
                      {/* Quality Indicators */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Participant Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4">
                        <div className="text-white">
                          <div className="font-semibold text-sm sm:text-base">{participantName}</div>
                          <div className="text-xs sm:text-sm text-gray-300">({participantRole})</div>
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            <span>Excellent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Show placeholder when no participants yet
                <>
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-purple flex items-center justify-center text-white text-2xl sm:text-3xl font-semibold mx-auto mb-3">
                        U
                      </div>
                      <p className="text-gray-700 font-medium">You</p>
                      <p className="text-sm text-gray-500">Connecting...</p>
                    </div>
                  </div>
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl sm:text-3xl font-semibold mx-auto mb-3">
                        ?
                      </div>
                      <p className="text-gray-700 font-medium">Waiting for others...</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* AI Insights Sidebar */}
        {showAIInsights && (
          <div className="hidden lg:block fixed right-0 top-[60px] bottom-[100px] w-80 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">AI Insights</h3>
              <button
                onClick={() => setShowAIInsights(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Session started successfully. Monitoring active.</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">Sentiment: <span className="font-medium text-gray-800">Neutral/Positive</span></p>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Toggle Button (Mobile) */}
        {!showAIInsights && (
          <button
            onClick={() => setShowAIInsights(true)}
            className="lg:hidden fixed top-20 right-4 bg-primary-purple text-white p-2 rounded-lg shadow-lg z-10"
          >
            <span className="text-sm">AI</span>
          </button>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className={`fixed right-0 top-[60px] bottom-[100px] w-full sm:w-96 lg:w-80 bg-white shadow-2xl border-l border-gray-200 z-20 ${showAIInsights ? 'lg:right-80' : ''}`}>
            <ChatPanel
              room={room}
              isLocalParticipant={isLocalParticipant}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="bg-primary-purple rounded-t-3xl p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap max-w-4xl mx-auto">
          <button
            onClick={toggleAudio}
            className={`flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-full transition-all ${
              isAudioEnabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-red-500/80 text-white hover:bg-red-500'
            }`}
          >
            <span className="text-xl sm:text-2xl">{isAudioEnabled ? '🎤' : '🔇'}</span>
            <span className="text-xs sm:text-sm font-medium">Mute</span>
          </button>

          <button
            onClick={toggleVideo}
            className={`flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-full transition-all ${
              isVideoEnabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-red-500/80 text-white hover:bg-red-500'
            }`}
          >
            <span className="text-xl sm:text-2xl">{isVideoEnabled ? '📹' : '📷'}</span>
            <span className="text-xs sm:text-sm font-medium">Video</span>
          </button>

          <button
            onClick={async () => {
              try {
                await toggleScreenShare();
              } catch (error) {
                console.error('Error in screen share button:', error);
              }
            }}
            className={`flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-full transition-all ${
              isScreenShareEnabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="text-xl sm:text-2xl">🖥️</span>
            <span className="text-xs sm:text-sm font-medium">Screen Share</span>
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-full transition-all ${
              showChat
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="text-xl sm:text-2xl">💬</span>
            <span className="text-xs sm:text-sm font-medium">Chat</span>
          </button>

          <button
            onClick={() => setShowEndModal(true)}
            className="flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <span className="text-xl sm:text-2xl">✕</span>
            <span className="text-xs sm:text-sm font-medium">End Session</span>
          </button>

          <button
            onClick={() => setShowEndModal(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-all"
          >
            Emergency Terminate
          </button>
        </div>
      </div>

      {/* End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">End Session?</h2>
            <p className="text-sm sm:text-base text-text-grey mb-4 sm:mb-6">
              Are you sure you want to end this session? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button
                onClick={() => setShowEndModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEndSession}
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
