'use client';

import { useState, useEffect, useRef } from 'react';
import { Room, RemoteParticipant, LocalParticipant, RoomEvent } from 'livekit-client';

interface ChatMessage {
  id: string;
  participantId: string;
  participantName: string;
  message: string;
  timestamp: number;
  isLocal: boolean;
}

interface ChatPanelProps {
  room: Room | null;
  isLocalParticipant: (participant: any) => boolean;
  onClose?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ room, isLocalParticipant, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for data messages from LiveKit
  useEffect(() => {
    if (!room) {
      console.log('ChatPanel: No room available');
      return;
    }

    // Wait for room to be connected
    if (room.state !== 'connected') {
      console.log('ChatPanel: Room not connected yet, state:', room.state);
      const checkConnection = setInterval(() => {
        if (room.state === 'connected') {
          clearInterval(checkConnection);
          console.log('ChatPanel: Room connected, setting up listener');
        }
      }, 500);
      return () => clearInterval(checkConnection);
    }

    console.log('ChatPanel: Setting up data received listener, room state:', room.state);

    const handleDataReceived = (payload: Uint8Array, participant?: RemoteParticipant, kind?: any, topic?: string) => {
      try {
        console.log('=== Data received event ===', { 
          topic, 
          participant: participant?.identity, 
          participantName: participant?.name,
          payloadLength: payload.length,
          kind,
          hasParticipant: !!participant
        });

        // Only handle chat messages
        if (topic && topic !== 'chat') {
          console.log('Ignoring non-chat message with topic:', topic);
          return;
        }

        const decoder = new TextDecoder();
        const messageText = decoder.decode(payload);
        const messageData = JSON.parse(messageText);

        console.log('Parsed message data:', messageData);

        if (messageData.type === 'chat' && messageData.message) {
          // Check if this is from a remote participant
          if (!participant || participant instanceof LocalParticipant) {
            console.log('Skipping - no participant or local participant');
            return;
          }

          const participantName = participant.name || participant.identity || 'Unknown';
          const participantId = participant.identity;

          console.log('✅ Adding remote message:', { participantName, message: messageData.message });

          const newMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            participantId,
            participantName,
            message: messageData.message,
            timestamp: messageData.timestamp || Date.now(),
            isLocal: false,
          };

          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m => 
              m.participantId === participantId && 
              m.message === messageData.message && 
              Math.abs(m.timestamp - newMessage.timestamp) < 2000
            );
            if (exists) {
              console.log('Message already exists, skipping duplicate');
              return prev;
            }
            console.log('Adding new message to state, total messages:', prev.length + 1);
            return [...prev, newMessage];
          });
        }
      } catch (error) {
        console.error('Error parsing chat message:', error);
      }
    };

    // Use RoomEvent.DataReceived - signature: (payload, participant?, kind?, topic?)
    room.on(RoomEvent.DataReceived, handleDataReceived);
    console.log('ChatPanel: DataReceived listener registered on room, room state:', room.state);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      console.log('ChatPanel: DataReceived listener removed');
    };
  }, [room, isLocalParticipant]);

  const handleSendMessage = async () => {
    if (!room || !inputMessage.trim() || isSending) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      // Create message payload
      const messageData = {
        type: 'chat',
        message: message,
        timestamp: Date.now(),
      };

      // Encode and send via data channel
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(messageData));

      // Send to all participants via data channel
      console.log('=== Sending message ===', { 
        message, 
        roomState: room.state, 
        remoteParticipants: room.remoteParticipants.size,
        localParticipant: room.localParticipant.identity
      });
      
      try {
        // Ensure room is connected
        if (room.state !== 'connected') {
          console.warn('Room not connected, cannot send message. State:', room.state);
          throw new Error('Room not connected');
        }

        await room.localParticipant.publishData(data, {
          reliable: true,
          topic: 'chat',
          // Don't specify destinationIdentities to broadcast to all
        });
        console.log('✅ Message sent successfully via publishData');
      } catch (error) {
        console.error('❌ Error in publishData:', error);
        throw error;
      }

      // Add message to local state immediately for better UX
      const localMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        participantId: room.localParticipant.identity,
        participantName: room.localParticipant.name || 'You',
        message: message,
        timestamp: Date.now(),
        isLocal: true,
      };

      setMessages((prev) => [...prev, localMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore input if sending failed
      setInputMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-primary-purple text-white">
        <h3 className="font-semibold text-base sm:text-lg">Chat</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl font-bold"
            aria-label="Close chat"
          >
            ×
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-3 py-2 ${
                  msg.isLocal
                    ? 'bg-primary-purple text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {/* Show participant name for all messages */}
                <div className={`text-xs font-semibold mb-1 ${
                  msg.isLocal ? 'text-white/80' : 'text-gray-600'
                }`}>
                  {msg.participantName}
                </div>
                <div className="text-sm sm:text-base break-words">{msg.message}</div>
                <div
                  className={`text-xs mt-1 ${
                    msg.isLocal ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending || !room}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending || !inputMessage.trim() || !room}
            className="px-4 sm:px-6 py-2 bg-primary-purple text-white rounded-lg hover:bg-primary-purple-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
          >
            {isSending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

