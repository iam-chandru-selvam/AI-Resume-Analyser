export type Suggestion = {
  type: "good" | "improve";
  tip: string;
  explanation: string;
};

export interface FeedbackCategory {
  score: number;
  tips: Suggestion[];
}

export interface Feedback {
  overallScore: number;

  toneAndStyle: FeedbackCategory;
  content: FeedbackCategory;
  structure: FeedbackCategory;
  skills: FeedbackCategory;

  ATS: {
    score: number;
    suggestions: Suggestion[];
  };

  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
