/**
 * Mock AI Insights Data
 */
export interface AIInsight {
  id: string;
  type: 'sentiment' | 'topic' | 'engagement' | 'recommendation';
  timestamp: number;
  content: string;
  confidence?: number;
}

// Generate mock insights
export const generateMockInsights = (): AIInsight[] => {
  const now = Date.now();
  
  return [
    {
      id: '1',
      type: 'sentiment',
      timestamp: now - 5000, // 5 seconds ago
      content: 'Sentiment: Neutral/Positive',
      confidence: 0.85,
    },
    {
      id: '2',
      type: 'topic',
      timestamp: now - 30000, // 30 seconds ago
      content: 'Topic: Discussing progress and goals',
      confidence: 0.92,
    },
    {
      id: '3',
      type: 'engagement',
      timestamp: now - 60000, // 1 minute ago
      content: 'Engagement: High - Active participation',
      confidence: 0.88,
    },
    {
      id: '4',
      type: 'recommendation',
      timestamp: now - 90000, // 1.5 minutes ago
      content: 'Recommendation: Consider discussing next steps',
      confidence: 0.75,
    },
  ];
};

// Simulate real-time updates
export const simulateInsightUpdate = (existingInsights: AIInsight[]): AIInsight[] => {
  const now = Date.now();
  const newInsight: AIInsight = {
    id: `insight-${now}`,
    type: ['sentiment', 'topic', 'engagement', 'recommendation'][
      Math.floor(Math.random() * 4)
    ] as AIInsight['type'],
    timestamp: now,
    content: `New insight: ${['Positive interaction', 'Goal alignment', 'Active listening', 'Progress noted'][Math.floor(Math.random() * 4)]}`,
    confidence: 0.7 + Math.random() * 0.25,
  };

  // Add new insight and keep only last 10
  return [newInsight, ...existingInsights].slice(0, 10);
};

