import { Creation } from "../types";

export enum AIErrorCode {
  RATE_LIMIT = "RATE_LIMIT",
  SAFETY_BLOCK = "SAFETY_BLOCK",
  INVALID_PROMPT = "INVALID_PROMPT",
  API_KEY_ERROR = "API_KEY_ERROR",
  UNKNOWN = "UNKNOWN"
}

export class AIError extends Error {
  code: AIErrorCode;
  constructor(message: string, code: AIErrorCode = AIErrorCode.UNKNOWN) {
    super(message);
    this.name = "AIError";
    this.code = code;
  }
}

async function callAIProxy(payload: any) {
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "AI Proxy request failed");
    }

    return await response.json();
  } catch (error) {
    return handleAIError(error);
  }
}

function handleAIError(error: any): never {
  console.error("AI Service Error:", error);
  const message = error?.message || String(error);
  
  if (message.includes("429") || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("quota")) {
    throw new AIError("AI is currently under heavy load or rate limited. Please wait a moment and try again.", AIErrorCode.RATE_LIMIT);
  }
  
  if (message.includes("SAFETY") || message.toLowerCase().includes("safety filters") || message.toLowerCase().includes("blocked") || message.toLowerCase().includes("candidate")) {
    throw new AIError("Content was flagged by AI safety filters. Please try a different, more appropriate prompt.", AIErrorCode.SAFETY_BLOCK);
  }

  if (message.toLowerCase().includes("api key") || message.includes("403")) {
    throw new AIError("AI service configuration error. Please check your API key settings.", AIErrorCode.API_KEY_ERROR);
  }

  if (message.toLowerCase().includes("invalid") || message.includes("400")) {
    throw new AIError("Invalid request sent to the AI. Please refine your prompt and try again.", AIErrorCode.INVALID_PROMPT);
  }

  throw new AIError(message || "An unexpected error occurred while connecting to the AI service.", AIErrorCode.UNKNOWN);
}

export async function generateImage(
  prompt: string,
  style: string = "cinematic",
  aspectRatio: string = "1:1",
  model: string = "gemini-3.1-flash-lite-image"
): Promise<never> {
  void prompt;
  void style;
  void aspectRatio;
  void model;
  throw new AIError(
    "Legacy local image generation is disabled. Use contentApi.generateImage so Image Studio follows the Content Service flow.",
    AIErrorCode.UNKNOWN
  );
}

export interface CreatorProfile {
  games?: string[];
  audience?: string;
  goal?: string;
  frequency?: string;
  creatorName?: string;
}

export async function chatWithCoach(
  message: string, 
  history: { role: "user" | "model", text: string }[] = [], 
  creations: Creation[] = [],
  profile?: CreatorProfile
) {
  const creationContext = creations.length > 0 
    ? `\n\nUSER CREATIONS CONTEXT:\n${creations.map(c => `- Type: ${c.type}, Prompt: ${c.prompt || "N/A"}, Status: ${c.status}, Created: ${new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}`).join("\n")}`
    : "\n\n(No creation history found)";

  const profileContext = profile 
    ? `\n\nCREATOR PROFILE CONTEXT:\n- Name/Handle: ${profile.creatorName || "N/A"}\n- Games Played: ${profile.games?.join(", ") || "N/A"}\n- Target Audience: ${profile.audience || "N/A"}\n- Content Goals: ${profile.goal || "N/A"}\n- Posting Frequency: ${profile.frequency || "N/A"}`
    : "\n\n(No creator profile found)";

  const systemInstruction = `You are the nxclip.ai AI Creator Coach, a premium expert in viral gaming content and channel growth. 

CORE MISSION: Help gamers use nxclip.ai to its maximum potential to grow on YouTube, TikTok, and Instagram.

COACHING STYLE:
1. PRODUCT EXPERT: Proactively suggest how to use nxclip tools (Image Studio, Meme Generator, Clipper) to solve the user's growth problems.
2. ACTIONABLE: Always respond in brief, numbered steps. No fluff.
3. PLATFORM SPECIFIC: Give unique advice for YouTube Shorts vs TikTok FYP vs Instagram Reels.
4. STRATEGIC: Provide tactical advice on content strategy, identifying viral trends, and optimizing posting frequency.
5. GAMING FOCUSED: Use high-level gaming meta and terminology.
6. PERSONALIZED: Use the provided Creator Profile and Creation Context to tailor your advice specifically to the user's niche and audience.

When a user asks for advice, ALWAYS include a tip on how they can use an nxclip feature to achieve that result faster.

If the user asks about their specific creations (e.g., "Why was my clip rejected?", "How can I improve my recent memes?"), use the provided creation context to give specific feedback.${profileContext}${creationContext}`;

  const contents = [
    ...history.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    })),
    {
      role: "user",
      parts: [{ text: message }]
    }
  ];

  const response = await callAIProxy({
    model: "gemini-3.6-flash",
    contents,
    config: {
      systemInstruction
    }
  });

  return response.text;
}

export async function generateWeeklyReport(stats: { views: number, growth: string, contentBreakdown: { name: string, value: number }[] }) {
  const response = await callAIProxy({
    model: "gemini-3.6-flash",
    contents: `Generate a weekly performance report for a gaming creator with the following stats:
    - Total Views: ${stats.views}
    - Growth: ${stats.growth}
    - Content Breakdown: ${stats.contentBreakdown.map(c => `${c.name}: ${c.value}`).join(", ")}
    
    The report should include:
    1. A narrative summary (2-3 sentences) that is encouraging and professional.
    2. 3 actionable insights for the next week.
    
    Return the result as a JSON object with "summary" (string) and "insights" (array of strings).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          insights: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["summary", "insights"]
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as { summary: string, insights: string[] };
  }
  throw new Error("No report data found");
}

export async function generateCaptions(prompt: string) {
  const response = await callAIProxy({
    model: "gemini-3.6-flash",
    contents: `Generate 3 catchy, professional gaming social media captions for an image described as: "${prompt}". 
    Each caption should include 3-5 relevant gaming hashtags. 
    Return the result as a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "STRING",
          description: "A single social media caption with hashtags."
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as string[];
  }
  return [];
}

export interface PlanDay {
  day: string;
  type: "image" | "meme" | "clip";
  theme: string;
  tip: string;
}

export async function generateContentPlan(profile: CreatorProfile) {
  const response = await callAIProxy({
    model: "gemini-3.6-flash",
    contents: `Generate a 7-day gaming content plan for a creator with the following profile:
    - Games: ${profile.games?.join(", ") || "Gaming"}
    - Audience: ${profile.audience}
    - Goal: ${profile.goal}
    
    Return a JSON array of 7 objects, each with:
    - day: string (e.g., "Mon", "Tue")
    - type: string (one of: "image", "meme", "clip")
    - theme: string (catchy theme for the post)
    - tip: string (short actionable tip for this specific post)
    
    Ensure a good mix of content types and themes relevant to the games and audience.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            day: { type: "STRING" },
            type: { type: "STRING", enum: ["image", "meme", "clip"] },
            theme: { type: "STRING" },
            tip: { type: "STRING" }
          },
          required: ["day", "type", "theme", "tip"]
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as PlanDay[];
  }
  throw new Error("No plan data found");
}

export async function generateTitle(prompt: string) {
  const response = await callAIProxy({
    model: "gemini-3.6-flash",
    contents: `Generate a catchy, short title (max 5 words) for a gaming creation described as: "${prompt}". 
    Return the result as a JSON object with a single "title" field.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" }
        },
        required: ["title"]
      }
    }
  });

  if (response.text) {
    const data = JSON.parse(response.text);
    return data.title as string;
  }
  return "";
}
