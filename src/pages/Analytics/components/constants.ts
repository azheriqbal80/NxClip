import { TiktokIcon } from "../../../components/TiktokIcon";
import { Youtube, Instagram } from "lucide-react";

export const generateDailyTrend = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: [`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`][i % 7],
    views: Math.floor(Math.random() * 5000) + 2000,
    engagement: Math.floor(Math.random() * 800) + 200,
    shares: Math.floor(Math.random() * 300) + 50,
  }));
};

export const CONTENT_DATA = [
  { id: 1, type: "Video", title: "Apex Legends Clutch 2v1", game: "Apex Legends", platform: "TikTok", views: 45200, engagement: 12.4, retention: 78, watchTime: "0:45", date: "2024-03-20", viral: 88, thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop" },
  { id: 2, type: "Meme", title: "When the squad dies in Round 1", game: "Warzone", platform: "Instagram", views: 12500, engagement: 8.2, shares: 1200, saves: 450, date: "2024-03-19", viral: 65, thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=200&auto=format&fit=crop" },
  { id: 3, type: "Video", title: "MW3 Sniping Montage", game: "Call of Duty", platform: "YouTube", views: 89000, engagement: 4.8, retention: 42, watchTime: "3:12", date: "2024-03-18", viral: 92, thumbnail: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=200&auto=format&fit=crop" },
  { id: 4, type: "Meme", title: "Final Boss Energy", game: "Elden Ring", platform: "TikTok", views: 23100, engagement: 15.1, shares: 3400, saves: 890, date: "2024-03-17", viral: 84, thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=200&auto=format&fit=crop" },
  { id: 5, type: "Video", title: "Pro Player Settings Guide", game: "Valorant", platform: "YouTube", views: 15600, engagement: 9.9, retention: 65, watchTime: "8:45", date: "2024-03-16", viral: 45, thumbnail: "https://images.unsplash.com/photo-1624396115567-b4567cbc012e?q=80&w=200&auto=format&fit=crop" },
];

export const PLATFORM_STATS = [
  { id: 'tiktok', name: 'TikTok', icon: TiktokIcon, views: 128000, engagement: 11.2, growth: '+14.5%', followers: 1200, shares: 24500, color: 'var(--foreground)' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, views: 342000, engagement: 5.4, growth: '+8.2%', followers: 450, shares: 12100, color: '#FF0000' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, views: 89000, engagement: 14.8, growth: '+22.1%', followers: 670, shares: 8400, color: '#E4405F' },
];

export const GAME_PERFORMANCE = [
  { name: "Apex Legends", views: 145000, engagement: 12.1, color: "var(--primary)", status: "Top Performer" },
  { name: "Call of Duty", views: 98000, engagement: 8.4, color: "var(--secondary-foreground)", status: "Steady" },
  { name: "Valorant", views: 76000, engagement: 10.5, color: "var(--tertiary)", status: "Steady" },
  { name: "Fortnite", views: 45000, engagement: 14.2, color: "#F59E0B", status: "High Growth" },
  { name: "Elden Ring", views: 12000, engagement: 4.1, color: "#6366f1", status: "Low Engagement" },
];

export const AUDIENCE_STATS = {
  gender: [
    { name: 'Male', value: 68, color: 'var(--primary)' },
    { name: 'Female', value: 24, color: 'var(--tertiary)' },
    { name: 'Other', value: 8, color: 'var(--border)' },
  ],
  age: [
    { range: '13-17', val: 15 },
    { range: '18-24', val: 45 },
    { range: '25-34', val: 30 },
    { range: '35+', val: 10 },
  ],
  activeHours: Array.from({ length: 7 }, (_, day) => 
    Array.from({ length: 24 }, (_, hour) => ({
      day,
      hour,
      value: Math.floor(Math.random() * 100),
    }))
  ).flat()
};

export const GEO_INTEL_DATA = [
  { 
    country: "United States", 
    id: "USA", 
    views: 3635, 
    viewsPercent: 45.4, 
    avgDurationSeconds: 311, 
    avgDuration: "5:11", 
    avgPercent: 60.9, 
    watchTime: 18896, 
    watchTimePercent: 56.1, 
    color: "#3b82f6",
    topGame: "Valorant",
    bestPlatform: "TikTok",
    bestFormat: "Clutch Clips",
    growth: 18,
    viralityScore: 92,
    retention: 61
  },
  { 
    country: "India", 
    id: "IND", 
    views: 754, 
    viewsPercent: 9.4, 
    avgDurationSeconds: 155, 
    avgDuration: "2:35", 
    avgPercent: 26.5, 
    watchTime: 1959, 
    watchTimePercent: 5.8, 
    color: "#8b5cf6",
    topGame: "BGMI",
    bestPlatform: "Instagram",
    bestFormat: "Meme Edits",
    growth: 24,
    viralityScore: 85,
    retention: 42
  },
  { 
    country: "Brazil", 
    id: "BRA", 
    views: 642, 
    viewsPercent: 8.0, 
    avgDurationSeconds: 210, 
    avgDuration: "3:30", 
    avgPercent: 45.2, 
    watchTime: 2247, 
    watchTimePercent: 6.7, 
    color: "#10b981",
    topGame: "Fortnite",
    bestPlatform: "TikTok",
    bestFormat: "Funny Fails",
    growth: 42,
    viralityScore: 94,
    retention: 52
  },
  { 
    country: "Philippines", 
    id: "PHL", 
    views: 240, 
    viewsPercent: 3.0, 
    avgDurationSeconds: 181, 
    avgDuration: "3:01", 
    avgPercent: 30.7, 
    watchTime: 725, 
    watchTimePercent: 2.2, 
    color: "#0ea5e9",
    topGame: "Mobile Legends",
    bestPlatform: "TikTok",
    bestFormat: "Highlights",
    growth: 12,
    viralityScore: 78,
    retention: 38
  },
  { 
    country: "Indonesia", 
    id: "IDN", 
    views: 219, 
    viewsPercent: 2.7, 
    avgDurationSeconds: 195, 
    avgDuration: "3:15", 
    avgPercent: 32.6, 
    watchTime: 715, 
    watchTimePercent: 2.1, 
    color: "#f43f5e",
    topGame: "Free Fire",
    bestPlatform: "TikTok",
    bestFormat: "Meme Edits",
    growth: 28,
    viralityScore: 81,
    retention: 35
  },
  { 
    country: "Germany", 
    id: "DEU", 
    views: 185, 
    viewsPercent: 2.3, 
    avgDurationSeconds: 245, 
    avgDuration: "4:05", 
    avgPercent: 51.2, 
    watchTime: 755, 
    watchTimePercent: 2.2, 
    color: "#d946ef",
    topGame: "CS2",
    bestPlatform: "YouTube",
    bestFormat: "Strategy Guides",
    growth: 16,
    viralityScore: 72,
    retention: 55
  },
  { 
    country: "Canada", 
    id: "CAN", 
    views: 158, 
    viewsPercent: 2.0, 
    avgDurationSeconds: 261, 
    avgDuration: "4:21", 
    avgPercent: 52.8, 
    watchTime: 688, 
    watchTimePercent: 2.0, 
    color: "#f59e0b",
    topGame: "Valorant",
    bestPlatform: "TikTok",
    bestFormat: "Clutch Clips",
    growth: 14,
    viralityScore: 88,
    retention: 58
  },
  { 
    country: "United Kingdom", 
    id: "GBR", 
    views: 247, 
    viewsPercent: 3.1, 
    avgDurationSeconds: 166, 
    avgDuration: "2:46", 
    avgPercent: 37.7, 
    watchTime: 685, 
    watchTimePercent: 2.0, 
    color: "#6366f1",
    topGame: "Call of Duty",
    bestPlatform: "YouTube",
    bestFormat: "Highlights",
    growth: 10,
    viralityScore: 82,
    retention: 48
  },
];

export const GEO_INTEL_STRATEGY = [
  { insightKey: "brazil_valorant", confidence: 94, type: "growth", regionId: "BRA" },
  { insightKey: "sea_memes", confidence: 88, type: "viral", regionId: "SEA" },
  { insightKey: "usa_tutorial", confidence: 91, type: "retention", regionId: "USA" },
  { insightKey: "germany_traction", confidence: 82, type: "momentum", regionId: "DEU" },
  { insightKey: "india_shortform", confidence: 85, type: "engagement", regionId: "IND" },
  { insightKey: "latam_subtitles", confidence: 89, type: "language", regionId: "LATAM" }
];

export const REGION_TOTALS = {
  views: 7999,
  avgDuration: "4:12",
  avgPercent: 47.5,
  watchTime: 33652,
  reach: "1.2M",
  bestRegion: "USA",
  growthMomentum: "+24%",
  topPlatform: "TikTok"
};

export const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
