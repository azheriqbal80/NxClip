export type Plan = "free" | "pro" | "studio";

export interface ContentPlanItem {
  day: string | number;
  type?: "image" | "meme" | "clip";
  theme?: string;
  tip?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  gameNiches?: string[];
  games?: string[];
  bio?: string;
  audience?: string;
  goal?: string;
  frequency?: string;
  startPoint?: string;
  plan: Plan;
  role: "admin" | "user" | "creator";
  onboardingCompleted?: boolean;
  socials?: {
    twitch?: string;
    youtube?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  coachQuestionsRemaining?: number;
  contentPlan?: ContentPlanItem[];
  updatedAt?: string | number | Date | any;
  createdAt: string | number | Date | any;
}

export interface Creation {
  id: string;
  uid: string;
  type: "image" | "meme" | "clip";
  url: string;
  prompt?: string;
  caption?: string;
  hashtags?: string[];
  status: "processing" | "published" | "rejected";
  createdAt: string | number | Date | any;
}

export interface AnalyticsReport {
  id: string;
  uid: string;
  weekEnding: string | number | Date | any;
  summary: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    completionRate: number;
  };
  actionItems: string[];
}
