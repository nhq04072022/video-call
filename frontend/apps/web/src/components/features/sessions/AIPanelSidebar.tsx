/**
 * AI Panel Sidebar Component - Displays AI insights for mentors
 */
import React, { useState, useEffect } from 'react';
import { generateMockInsights, simulateInsightUpdate, type AIInsight } from '../../../data/mockAIInsights';

interface AIPanelSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const AIPanelSidebar: React.FC<AIPanelSidebarProps> = ({
  isCollapsed,
  onToggle,
}) => {
  const [insights, setInsights] = useState<AIInsight[]>(generateMockInsights());

  // Simulate real-time updates every 15-30 seconds
  useEffect(() => {
    if (isCollapsed) return;

    const updateInterval = setInterval(() => {
      setInsights((prev) => simulateInsightUpdate(prev));
    }, 15000 + Math.random() * 15000); // 15-30 seconds

    return () => clearInterval(updateInterval);
  }, [isCollapsed]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'sentiment':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
          </svg>
        );
      case 'topic':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.829V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      case 'engagement':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM6 10.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM12.5 10.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM17 10.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
          </svg>
        );
      case 'recommendation':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'sentiment':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'topic':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'engagement':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'recommendation':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo}h ago`;
  };

  return (
    <aside
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed ? 'w-0 opacity-0' : 'w-80 opacity-100'
      }`}
      role="complementary"
      aria-label="AI Insights"
    >
      <div
        className="bg-white shadow-2xl p-6 flex flex-col h-full rounded-3xl"
        style={{
          borderRadius: '24px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <h2 id="ai-insights-title" className="text-xl font-bold text-gray-900">AI Insights</h2>
          <span id="ai-insights-description" className="sr-only">
            AI-powered insights panel showing real-time analysis of the session including sentiment, topics, engagement, and recommendations.
          </span>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isCollapsed ? 'Expand AI Insights panel' : 'Collapse AI Insights panel'}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
              />
            </svg>
          </button>
        </div>

        {/* Insights List */}
        <div 
          className="flex-1 space-y-4 overflow-y-auto"
          role="list"
          aria-label="AI insights list"
          aria-live="polite"
          aria-atomic="false"
        >
          {insights.length === 0 ? (
            <div className="text-center text-gray-500 py-8" role="status" aria-live="polite">
              <p className="text-sm">No insights available yet</p>
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-4 rounded-lg border ${getInsightColor(
                  insight.type
                )}`}
                style={{ borderRadius: '12px' }}
                role="listitem"
                aria-label={`${insight.type} insight: ${insight.content}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase">
                      {insight.type}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatTimestamp(insight.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">{insight.content}</p>
                  {insight.confidence && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-current rounded-full"
                          style={{ width: `${insight.confidence * 100}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

