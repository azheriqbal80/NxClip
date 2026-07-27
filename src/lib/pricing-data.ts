import { Zap, Sparkles, Shield, Info } from "lucide-react";

export interface PricingPlan {
  id: string;
  name: string;
  whoItIsFor: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  cta: string;
  popular: boolean;
  icon: React.ElementType;
  landingFeatures: string[];
  limits: {
    clips: string;
    memes: string;
    images: string;
    platforms: string;
    quality: string;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Free",
    whoItIsFor: "Free forever",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Start creating clips, memes, and images with basic limits.",
    cta: "Start for free",
    popular: false,
    icon: Zap,
    landingFeatures: [
      "5 image/meme generations per day",
      "Clip uploads up to 500MB",
      "3 Creator Coach messages/mo",
      "Basic content creation workflow",
      "Basic analytics preview",
      "Standard quality exports",
    ],
    limits: {
      clips: "Up to 500MB",
      memes: "5 / day",
      images: "5 / day",
      platforms: "1 Platform",
      quality: "720p",
    },
  },
  {
    id: "pro",
    name: "Pro Creator",
    whoItIsFor: "Most Popular",
    priceMonthly: 12,
    priceYearly: 10,
    description: "Unlock unlimited creation, full analytics, and AI coaching.",
    cta: "Start Pro free for 7 days",
    popular: true,
    icon: Sparkles,
    landingFeatures: [
      "Unlimited creations",
      "Clip uploads up to 5GB",
      "Unlimited Creator Coach",
      "Full analytics dashboard",
      "Engagement rate access",
      "Weekly AI coaching report",
    ],
    limits: {
      clips: "Up to 5GB",
      memes: "Unlimited",
      images: "Unlimited",
      platforms: "TT / YT / IG",
      quality: "4K UHD",
    },
  },
  {
    id: "studio",
    name: "Studio",
    whoItIsFor: "For teams and esports orgs",
    priceMonthly: 39,
    priceYearly: 32,
    description: "For teams and esports orgs creating at higher volume.",
    cta: "Start Studio trial",
    popular: false,
    icon: Shield,
    landingFeatures: [
      "Everything in Pro",
      "Team workflows",
      "Multi-account management",
      "Shared content library",
      "Advanced reporting",
      "Collaboration tools",
    ],
    limits: {
      clips: "Up to 5GB",
      memes: "Unlimited",
      images: "Unlimited",
      platforms: "Unlimited",
      quality: "4K UHD + Proxy",
    },
  },
];

export interface ComparisonCategory {
  title: string;
  features: {
    name: string;
    starter: string | boolean;
    pro: string | boolean;
    studio: string | boolean;
  }[];
}

export const COMPARISON_TABLE: ComparisonCategory[] = [
  {
    title: "Content Creation",
    features: [
      { name: "Image/meme generations", starter: "5 per day", pro: "Unlimited", studio: "Unlimited" },
      { name: "Video clip upload limit", starter: "Up to 500MB", pro: "Up to 5GB", studio: "Up to 5GB" },
      { name: "Clip editing workflow", starter: true, pro: true, studio: true },
      { name: "Meme generation", starter: "Limited", pro: "Unlimited", studio: "Unlimited" },
      { name: "Image generation", starter: "Limited", pro: "Unlimited", studio: "Unlimited" },
    ],
  },
  {
    title: "AI Coach",
    features: [
      { name: "Creator Coach messages", starter: "3 / mo", pro: "Unlimited", studio: "Unlimited" },
      { name: "AI content suggestions", starter: "Basic", pro: "Advanced", studio: "Advanced + Teams" },
      { name: "Weekly growth plan guidance", starter: "Basic", pro: true, studio: true },
      { name: "Weekly AI coaching report", starter: "Preview", pro: true, studio: true },
    ],
  },
  {
    title: "Analytics",
    features: [
      { name: "Basic analytics preview", starter: true, pro: true, studio: true },
      { name: "Engagement rate card", starter: false, pro: true, studio: true },
      { name: "Full analytics dashboard", starter: false, pro: true, studio: true },
      { name: "Platform comparison", starter: "Preview", pro: true, studio: true },
      { name: "Content performance insights", starter: "Limited", pro: true, studio: "Advanced" },
      { name: "Best posting time / heatmap", starter: false, pro: true, studio: true },
    ],
  },
  {
    title: "Publishing & Sharing",
    features: [
      { name: "TikTok publishing/scheduling", starter: true, pro: true, studio: true },
      { name: "YouTube Shorts publishing", starter: true, pro: true, studio: true },
      { name: "Instagram Reels", starter: false, pro: true, studio: true },
      { name: "Scheduled posts", starter: false, pro: true, studio: true },
      { name: "Cross-platform tracking", starter: "Basic", pro: true, studio: true },
    ],
  },
  {
    title: "Library",
    features: [
      { name: "Content library", starter: "Basic", pro: "Full", studio: "Shared" },
      { name: "Saved ideas/templates", starter: true, pro: true, studio: true },
      { name: "Large file support", starter: false, pro: true, studio: true },
      { name: "Draft management", starter: true, pro: true, studio: true },
    ],
  },
  {
    title: "Team Features",
    features: [
      { name: "Team workflows", starter: false, pro: false, studio: true },
      { name: "Multi-account management", starter: false, pro: false, studio: true },
      { name: "Shared content library", starter: false, pro: false, studio: true },
      { name: "Collaboration tools", starter: false, pro: false, studio: true },
    ],
  },
  {
    title: "Support",
    features: [
      { name: "Community support", starter: true, pro: true, studio: true },
      { name: "Priority support", starter: false, pro: false, studio: true },
      { name: "Custom onboarding", starter: false, pro: false, studio: true },
    ],
  },
];

export const FAQS = [
  {
    question: "Can I start for free?",
    answer: "Yes! You can start with our Free forever plan to test the content creation workflow and basic analytics without any commitment.",
  },
  {
    question: "Do I need a credit card for the Pro trial?",
    answer: "No credit card is required to start your 7-day Pro Creator trial. You only pay when you decide to continue after the trial ends.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. Our plans are flexible. You can cancel your subscription at any time from your settings with no hidden fees or contracts.",
  },
  {
    question: "What happens if I downgrade?",
    answer: "If you downgrade to Free, you will retain access to your Pro features until the end of your current billing period, after which your account will revert to the Free limits.",
  },
  {
    question: "What platforms are supported?",
    answer: "NexaClip is built for TikTok, YouTube Shorts, and Instagram Reels. We provide cross-platform analytics and publishing workflows for all three.",
  },
  {
    question: "What happens when I hit the free generation limit?",
    answer: "On the Free plan, you get 5 image/meme generations per day. If you hit this limit, you can either wait for the next day's reset or upgrade to Pro Creator for unlimited generations.",
  },
  {
    question: "What upload size does Pro support?",
    answer: "Pro Creator supports video clip uploads up to 5GB, allowing you to process high-resolution gameplay and long sessions without worrying about file size limits.",
  },
  {
    question: "Is Studio for teams and esports orgs?",
    answer: "Yes, Studio is specifically designed for agencies, esports organizations, and creator teams who need multi-account management and collaborative shared libraries.",
  },
];

export const UPGRADE_TRIGGERS = [
  { 
    title: "You hit your daily limit", 
    description: "You used all 5 free image/meme generations. Pro unlocks unlimited creation." 
  },
  { 
    title: "Your clip is too large", 
    description: "Free uploads support up to 500MB. Pro unlocks uploads up to 5GB." 
  },
  { 
    title: "You need more coaching", 
    description: "Free includes 3 Creator Coach messages per month. Pro gives you unlimited coaching." 
  },
  { 
    title: "You want full analytics", 
    description: "Unlock engagement rate, platform comparison, and full performance history." 
  },
  { 
    title: "You want weekly AI reports", 
    description: "Get your weekly coaching report with what worked, what to fix, and what to create next." 
  },
  { 
    title: "Professional Quality", 
    description: "You want watermark-free 4K Ultra-HD exports for all platforms." 
  },
];

export const PLAN_RECOMMENDATIONS = [
  {
    name: "Free",
    icon: Info,
    description: "For new creators exploring content workflows. Perfect for starting your channel and testing ideas.",
    variant: "standard"
  },
  {
    name: "Pro",
    icon: Sparkles,
    description: "For serious creators posting across multiple platforms. Unlocks unlimited power and advanced growth analytics.",
    variant: "premium"
  },
  {
    name: "Studio",
    icon: Shield,
    description: "For esports teams and agencies managing multiple creator accounts with custom high-volume needs.",
    variant: "professional"
  }
];
