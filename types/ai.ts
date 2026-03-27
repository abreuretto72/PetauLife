export interface DiaryNarrationResponse {
  narration: string;
  mood_detected: string | null;
  language: 'pt-BR' | 'en-US';
  tokens_used: number;
}

export interface PhotoAnalysisResponse {
  breed: {
    name: string;
    confidence: number;
  } | null;
  estimated_age_months: number | null;
  estimated_weight_kg: number | null;
  size: 'small' | 'medium' | 'large' | null;
  mood: {
    id: string;
    confidence: number;
  } | null;
  health_observations: {
    observation: string;
    confidence: number;
    severity: 'info' | 'attention' | 'concern';
  }[];
  disclaimer: string;
}

export interface AIInsightResponse {
  insight: string;
  category: 'health' | 'behavior' | 'nutrition' | 'care';
  pet_id: string;
  based_on: string[];
}
