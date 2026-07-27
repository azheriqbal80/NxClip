import axios from "axios";
import { apiGatewayInstance } from "./api/interceptors";
import { safeLocalStorage, safeSessionStorage } from "../lib/safeStorage";
import { STORAGE_KEYS, GATEWAY_CONFIG } from "../constants";
import { getRefreshToken, clearPersistedUser } from "./auth/authService";

// Interface for API Gateway responses and errors
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  code?: string;
  correlationId?: string;
  timestamp?: string;
}

// Global toggle for API mode. Can be set in developer tools or localStorage
export function isRealApiEnabled(): boolean {
  return true;
}

export function setRealApiEnabled(enabled: boolean) {
  safeLocalStorage.setItem("nx_auth_provider", enabled ? "gateway" : "mock");
  // Keep legacy for compatibility if needed, but the primary is now nx_auth_provider
  safeLocalStorage.setItem(STORAGE_KEYS.USE_REAL_API, enabled ? "true" : "false");
  safeLocalStorage.setItem(STORAGE_KEYS.MOCK_API, enabled ? "false" : "true");
}

const isConfiguredGatewayUrl = (url: string | undefined, allowLocal = false): url is string => {
  if (!url || url === "") {
    return false;
  }

  if (allowLocal) {
    return true;
  }

  return !url.includes("localhost") && !url.includes("127.0.0.1");
};

// Resolve dynamic API Gateway URL based on active environment profile.
export function resolveBaseGatewayUrl(overrideEnv?: string): string {
  const apiEnv = overrideEnv || safeLocalStorage.getItem(STORAGE_KEYS.API_ENV) || "development";
  
  if (apiEnv === "staging") {
    const stagingUrl = import.meta.env.VITE_API_GATEWAY_URL_STAGING;
    if (isConfiguredGatewayUrl(stagingUrl)) {
      return stagingUrl;
    }
    return GATEWAY_CONFIG.STAGING_FALLBACK;
  }
  
  if (apiEnv === "production") {
    const prodUrl = import.meta.env.VITE_API_GATEWAY_URL_PRODUCTION;
    if (isConfiguredGatewayUrl(prodUrl)) {
      return prodUrl;
    }
    return GATEWAY_CONFIG.PRODUCTION_FALLBACK;
  }
  
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_GATEWAY_URL;
  if (isConfiguredGatewayUrl(envUrl, true)) {
    return envUrl;
  }
  
  return GATEWAY_CONFIG.PRODUCTION_FALLBACK;
}

/**
 * Returns the gateway source label associated with a specific gateway profile.
 * Useful for developer documentation and onboarding.
 */
export function getEnvVarNameForEnv(env: string): string {
  switch (env) {
    case "staging":
      return import.meta.env.VITE_API_GATEWAY_URL_STAGING ? "VITE_API_GATEWAY_URL_STAGING" : "built-in staging gateway";
    case "production":
      return import.meta.env.VITE_API_GATEWAY_URL_PRODUCTION ? "VITE_API_GATEWAY_URL_PRODUCTION" : "built-in production gateway";
    default:
      if (import.meta.env.VITE_API_URL) {
        return "VITE_API_URL";
      }
      if (import.meta.env.VITE_API_GATEWAY_URL) {
        return "VITE_API_GATEWAY_URL";
      }
      return "built-in production gateway";
  }
}

// ==========================================
// CIRCUIT BREAKER PATTERN & HYBRID CACHING STRATEGY
// ==========================================

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;  // Number of failures before tripping to OPEN
  cooldownPeriodMs?: number;  // Time in OPEN state before trying HALF_OPEN
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 3,
      cooldownPeriodMs: options.cooldownPeriodMs ?? 15000,
    };
  }

  public getState(): CircuitState {
    if (this.state === "OPEN" && Date.now() - this.lastFailureTime > this.options.cooldownPeriodMs) {
      this.state = "HALF_OPEN";
      console.log(`[Circuit Breaker] Transitioned to HALF_OPEN. Attempting probe request.`);
    }
    return this.state;
  }

  public recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  public recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === "CLOSED" || this.state === "HALF_OPEN") {
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = "OPEN";
        console.warn(
          `[Circuit Breaker] TRIPPED! Sequential failures: ${this.failureCount}. State is now OPEN. Cooldown: ${this.options.cooldownPeriodMs}ms`
        );
      }
    }
  }

  public getFailureCount(): number {
    return this.failureCount;
  }

  public getLastFailureTime(): number {
    return this.lastFailureTime;
  }

  public forceOpen() {
    this.state = "OPEN";
    this.failureCount = this.options.failureThreshold;
    this.lastFailureTime = Date.now();
    console.warn(`[Circuit Breaker] Manually TRIPPED state to OPEN`);
  }

  public reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = 0;
    console.log(`[Circuit Breaker] Manually RESET state to CLOSED`);
  }

  public async execute<T>(
    requestFn: () => Promise<T>,
    fallbackFn: () => Promise<T>
  ): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      console.warn(`[Circuit Breaker] Fast-failing network request. Circuit is in OPEN state.`);
      return await fallbackFn();
    }

    try {
      const result = await requestFn();
      this.recordSuccess();
      return result;
    } catch (error: any) {
      const isNetworkError = !error?.statusCode;
      const isServerError = error?.statusCode >= 500 && error?.statusCode < 600;

      if (isNetworkError || isServerError) {
        console.warn(
          `[Circuit Breaker] Request failed (${isServerError ? "5xx Server Error" : "Network Integration Error"}). Recording failure.`
        );
        this.recordFailure();
      } else {
        console.log(`[Circuit Breaker] Client-side / domain error (${error?.statusCode}) received. Circuit remains unaffected.`);
      }

      return await fallbackFn();
    }
  }
}

// Registry of Circuit Breakers per root service module route
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(path: string): CircuitBreaker {
  const prefix = path.split("/")[1] || "default";
  if (!circuitBreakers.has(prefix)) {
    circuitBreakers.set(
      prefix,
      new CircuitBreaker({
        failureThreshold: 3,
        cooldownPeriodMs: 15000,
      })
    );
  }
  return circuitBreakers.get(prefix)!;
}

export interface CircuitStatusInfo {
  name: string;
  prefix: string;
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
}

export function getAllCircuitBreakersStatus(): CircuitStatusInfo[] {
  const services = [
    { name: "Identity Service (Auth & Users)", prefix: "auth" },
    { name: "Content Generation Engine", prefix: "content" },
    { name: "Trending Creator Feed", prefix: "feed" },
    { name: "Analytics Intel Processor", prefix: "analytics" },
    { name: "Notification Dispatcher", prefix: "notifications" },
  ];

  return services.map(s => {
    const cb = getCircuitBreaker(`/${s.prefix}`);
    return {
      name: s.name,
      prefix: s.prefix,
      state: cb.getState(),
      failureCount: cb.getFailureCount(),
      lastFailureTime: cb.getLastFailureTime(),
    };
  });
}

export function forceOpenCircuitBreaker(prefix: string) {
  const cb = getCircuitBreaker(`/${prefix}`);
  cb.forceOpen();
}

export function resetCircuitBreaker(prefix: string) {
  const cb = getCircuitBreaker(`/${prefix}`);
  cb.reset();
}

/**
 * Core generic Axios-based orchestrator that injects distributed tracking headers,
 * handles API authorization, and injects internal API keys for internal calls.
 *
 * LIVE-ONLY: every call targets the API gateway. On failure the real, structured
 * error is thrown — never silently substituted with mock or stale-cache data — so
 * the UI can always tell whether it is showing live data or an error state.
 */
async function performApiRequest<T = any>(
  path: string,
  options: RequestInit & { suppressErrorLog?: boolean } = {}
): Promise<T> {
  const method = options.method || "GET";

  const executeRealRequest = async (): Promise<T> => {
    try {
      let dataPayload: any = undefined;
      if (options.body) {
        try {
          dataPayload = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
        } catch {
          dataPayload = options.body;
        }
      }

      const response = await apiGatewayInstance.request({
        url: path,
        method: method as any,
        headers: options.headers as any,
        data: dataPayload,
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        if (error.response?.data && typeof error.response.data === "object") {
          throw error.response.data as ApiError;
        }
        // No HTTP response => network / gateway-unreachable failure
        const errJson: ApiError = statusCode
          ? { statusCode, message: error.message || `Request failed with status ${statusCode}`, code: "UPSTREAM_ERROR" }
          : { statusCode: 0, message: "Unable to reach the API gateway. Check your connection and try again.", code: "NETWORK_ERROR" };
        throw errJson;
      }
      throw error;
    }
  };

  const breaker = getCircuitBreaker(path);

  // Circuit open: fast-fail with a clear error instead of hammering a down service.
  if (breaker.getState() === "OPEN") {
    const service = path.split("/")[1] || "gateway";
    if (!options.suppressErrorLog) {
      console.warn(`[API Client] Circuit OPEN for ${path}. Fast-failing with service-unavailable error.`);
    }
    throw {
      statusCode: 503,
      message: `The ${service} service is temporarily unavailable. Please retry in a few seconds.`,
      code: "CIRCUIT_OPEN",
    } as ApiError;
  }

  try {
    const result = await executeRealRequest();
    // Treat proxy-surfaced 502/503 envelopes as failures.
    if (result && typeof result === "object" && "statusCode" in result && ((result as any).statusCode === 502 || (result as any).statusCode === 503)) {
      throw result;
    }
    breaker.recordSuccess();
    return result;
  } catch (error: any) {
    const status = error?.statusCode ?? error?.response?.status;
    const isNetworkError = !status;
    const isServerError = status >= 500 && status < 600;
    if (isNetworkError || isServerError) {
      breaker.recordFailure();
    }
    const isClientError = status >= 400 && status < 500;
    if (!options.suppressErrorLog && !isClientError) {
      console.error(`[API Client] Live request failed for ${method} ${path}:`, error?.message || error);
    }
    throw error;
  }
}

export function clearApiCache() {
  try {
    safeLocalStorage.keys().forEach((k) => {
      if (k.startsWith("nx_api_cache_")) {
        safeLocalStorage.removeItem(k);
      }
    });
    safeSessionStorage.keys().forEach((k) => {
      if (k.startsWith("nx_api_cache_")) {
        safeSessionStorage.removeItem(k);
      }
    });
  } catch {}
}

export const GLOBAL_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1280&q=80",
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1280&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1280&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1280&q=80",
];

export function extractValidImageUrl(item: any): string {
  if (!item) return GLOBAL_FALLBACK_IMAGES[0];

  // If item is directly a string URL
  if (typeof item === "string") {
    const trimmed = item.trim();
    if (
      trimmed &&
      !trimmed.includes("undefined") &&
      !trimmed.includes("null")
    ) {
      if (trimmed.includes("gcs-mock-upload-bucket") || trimmed.includes("mock-bucket")) {
        return GLOBAL_FALLBACK_IMAGES[0];
      }
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image")) {
        return trimmed;
      }
      if (trimmed.startsWith("/")) {
        if (trimmed.startsWith("/content/")) {
          const baseGateway = resolveBaseGatewayUrl();
          return `${baseGateway}${trimmed}`;
        }
        return `${window.location.origin}${trimmed}`;
      }
      return trimmed;
    }
  }

  const candidates = [
    item.imageUrl,
    item.thumbnailUrl,
    item.mediaUrl,
    item.cdnUrl,
    item.image,
    item.url,
    item.assetUrl,
    item.coverUrl,
    item.posterUrl,
    item.thumbnail,
    item.media,
    item.path,
    item.filePath,
    item.fileUrl,
    item.previewUrl,
    item.data?.imageUrl,
    item.data?.thumbnailUrl,
    item.data?.mediaUrl,
    item.data?.cdnUrl,
    item.data?.image,
    item.data?.url,
    item.data?.assetUrl,
    typeof item.data === "string" ? item.data : "",
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "string" &&
      candidate.trim() !== "" &&
      !candidate.includes("undefined") &&
      !candidate.includes("null")
    ) {
      const trimmed = candidate.trim();
      if (trimmed.includes("gcs-mock-upload-bucket") || trimmed.includes("mock-bucket")) {
        const seedStr = String(item.id || item.title || item.caption || "nxclip");
        const seed = seedStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return GLOBAL_FALLBACK_IMAGES[Math.abs(seed) % GLOBAL_FALLBACK_IMAGES.length];
      }
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image")) {
        return trimmed;
      }
      if (trimmed.startsWith("/")) {
        if (trimmed.startsWith("/content/")) {
          const baseGateway = resolveBaseGatewayUrl();
          return `${baseGateway}${trimmed}`;
        }
        return `${window.location.origin}${trimmed}`;
      }
      return trimmed;
    }
  }

  // Fallback to deterministic image based on item id or title
  const seedStr = String(item?.id || item?.title || item?.caption || "fallback");
  const seed = seedStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GLOBAL_FALLBACK_IMAGES[Math.abs(seed) % GLOBAL_FALLBACK_IMAGES.length];
}

// ==========================================
// 1. IDENTITY SERVICE MODULE
// ==========================================

export interface RegisterDto {
  email: string;
  username: string;
  displayName: string;
  password?: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    plan: string;
    emailVerified: boolean;
    roles: string[];
    createdAt: string;
    onboardingCompleted?: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export const identityApi = {
  register: async (dto: RegisterDto): Promise<AuthResponseDto> => {
    return performApiRequest<AuthResponseDto>(
      "/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }
    );
  },

  login: async (email: string, password?: string): Promise<AuthResponseDto> => {
    return performApiRequest<AuthResponseDto>(
      "/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );
  },

  refresh: async (refreshToken?: string): Promise<TokenResponseDto> => {
    return performApiRequest<TokenResponseDto>(
      "/auth/refresh",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );
  },

  // Canonical place to clear tokens — callers must NOT call clearPersistedUser()
  // again after this; doing so is redundant since this always clears in its finally.
  logout: async (): Promise<void> => {
    try {
      const refreshToken = getRefreshToken();
      const bodyPayload = refreshToken ? { refreshToken } : {};
      await performApiRequest<void>(
        "/auth/logout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
          suppressErrorLog: true,
        } as any
      );
    } catch (err) {
      console.warn("Server-side logout call finished with notice:", err);
    } finally {
      clearPersistedUser();
    }
  },

  getMe: async (): Promise<any> => {
    return performApiRequest(
      "/auth/me",
      { method: "GET" }
    );
  },

  checkEmail: async (email: string): Promise<{ available: boolean }> => {
    return performApiRequest<{ available: boolean }>(
      `/auth/check-email?email=${encodeURIComponent(email)}`,
      { method: "GET" }
    );
  },

  checkUsername: async (username: string): Promise<{ available: boolean }> => {
    return performApiRequest<{ available: boolean }>(
      `/auth/check-username?username=${encodeURIComponent(username)}`,
      { method: "GET" }
    );
  },

  verifyEmail: async (token: string): Promise<void> => {
    return performApiRequest<void>(
      "/auth/verify-email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }
    );
  },

  resendVerificationEmail: async (email: string): Promise<void> => {
    return performApiRequest<void>(
      "/auth/resend-verification",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
  },

  getVerificationToken: async (email: string): Promise<{ token: string }> => {
    return performApiRequest<{ token: string }>(
      `/auth/verification-token?email=${encodeURIComponent(email)}`,
      { method: "GET" }
    );
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return performApiRequest<{ success: boolean; message: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
  },

  resetPassword: async (dto: { email: string; code: string; newPassword?: string }): Promise<{ success: boolean }> => {
    return performApiRequest<{ success: boolean }>(
      "/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }
    );
  },

  getUserMe: async (): Promise<any> => {
    return performApiRequest(
      "/users/me",
      { method: "GET" }
    );
  },

  updateProfile: async (data: { displayName?: string; bio?: string; avatarUrl?: string }) => {
    return performApiRequest(
      "/users/me",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
  },

  getUserById: async (id: string): Promise<any> => {
    return performApiRequest(
      `/users/${id}`,
      { method: "GET" }
    );
  },

  getInternalUserById: async (userId: string): Promise<any> => {
    return performApiRequest(
      `/internal/users/${userId}`,
      { method: "GET" }
    );
  }
};

// ==========================================
// 2. CONTENT SERVICE MODULE
// ==========================================

export interface ContentDto {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "draft" | "processing" | "generation_failed" | "publishing" | "moderation_rejected" | "published" | "deleted" | string;
  contentType: "image" | "meme" | "clip" | string;
  thumbnailUrl: string;
  imageUrl?: string;
  mediaUrl?: string;
  cdnUrl?: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  caption?: string;
  selectedCaption?: string;
  hashtags?: string[];
  selectedHashtags?: string[];
  prompt?: string;
  style?: string;
  aspectRatio?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagement?: number;
  creatorName?: string;
  creatorAvatar?: string;
  reason?: string;
  moderationReason?: string;
  error?: string;
}

export interface GenerateContentResponse {
  contentId?: string;
  id?: string;
  jobId?: string;
  imageUrl?: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  captions?: string[];
  hashtagSets?: string[][];
  status?: string;
  reason?: string;
  retryable?: boolean;
}

export interface PublishContentResponse {
  message?: string;
  contentId?: string;
  jobId?: string;
  status?: string;
}

export const contentApi = {
  requestUploadUrl: async (fileName: string, mimeType: string, fileSize: number) => {
    return performApiRequest(
      "/content/upload-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, mimeType, fileSize }),
      }
    );
  },

  generateImage: async (prompt: string, style = "cinematic", aspectRatio = "16:9", model?: string): Promise<GenerateContentResponse> => {
    const body: { prompt: string; style: string; aspectRatio: string; model?: string } = { prompt, style, aspectRatio };
    if (model?.trim()) {
      body.model = model.trim();
    }

    return performApiRequest(
      "/content/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  },

  getContentList: async (cursor?: string, limitCount = 20): Promise<{ items: ContentDto[]; nextCursor?: string }> => {
    const safeLimit = Math.min(Math.max(1, limitCount), 100);
    const path = `/content?limit=${safeLimit}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    return performApiRequest(
      path,
      { method: "GET" }
    );
  },

  getUserContentList: async (limitCount = 100, cursor?: string): Promise<ContentDto[]> => {
    const pageLimit = Math.min(Math.max(1, limitCount || 100), 100);
    const allItems: ContentDto[] = [];
    let currentCursor = cursor;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = Math.ceil((limitCount || 100) / pageLimit);

    while (hasMore && pageCount < maxPages) {
      pageCount++;
      const url = `/content/mine?limit=${pageLimit}` + (currentCursor ? `&cursor=${encodeURIComponent(currentCursor)}` : "");
      const res = await performApiRequest<any>(
        url,
        { method: "GET" }
      );

      let items: ContentDto[] = [];
      let nextCursor: string | undefined = undefined;

      if (Array.isArray(res)) {
        items = res;
      } else if (res && typeof res === "object") {
        if (Array.isArray(res.items)) items = res.items;
        else if (Array.isArray(res.data)) items = res.data;
        nextCursor = res.nextCursor || res.cursor;
      }

      allItems.push(...items);

      if (nextCursor && items.length > 0 && allItems.length < (limitCount || 100)) {
        currentCursor = nextCursor;
      } else {
        hasMore = false;
      }
    }

    return allItems;
  },

  getMyContentById: async (id: string, options?: { suppressErrorLog?: boolean }): Promise<ContentDto> => {
    return performApiRequest<ContentDto>(
      `/content/mine/${id}`,
      { method: "GET", ...options }
    );
  },

  getContentById: async (id: string, options?: { suppressErrorLog?: boolean }): Promise<ContentDto> => {
    return performApiRequest(
      `/content/${id}`,
      { method: "GET", ...options }
    );
  },

  editContent: async (id: string, data: { title?: string; description?: string }): Promise<ContentDto> => {
    return performApiRequest(
      `/content/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
  },

  retryGeneration: async (id: string): Promise<GenerateContentResponse> => {
    return performApiRequest<GenerateContentResponse>(
      `/content/${id}/retry-generation`,
      { method: "POST" }
    );
  },

  publish: async (id: string, data?: { title?: string; caption?: string; hashtags?: string[]; description?: string }): Promise<PublishContentResponse> => {
    const payload: { title?: string; caption?: string; hashtags?: string[]; description?: string } = {};
    if (data?.title !== undefined) payload.title = data.title;
    if (data?.caption !== undefined) payload.caption = data.caption;
    if (data?.hashtags !== undefined) payload.hashtags = data.hashtags;
    if (data?.description !== undefined) payload.description = data.description;

    return performApiRequest<PublishContentResponse>(
      `/content/${id}/publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined,
      }
    );
  },

  deleteContent: async (id: string): Promise<void> => {
    return performApiRequest<void>(
      `/content/${id}`,
      { method: "DELETE" }
    );
  },

  moderationCallback: async (id: string, jobId: string, approved: boolean, flags?: string[]): Promise<void> => {
    return performApiRequest<void>(
      `/internal/content/${id}/callbacks/moderation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, approved, flags })
      }
    );
  },

  generationCallback: async (id: string, jobId: string, storageKey: string, thumbnailUrl?: string): Promise<void> => {
    return performApiRequest<void>(
      `/internal/content/${id}/callbacks/generation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, storageKey, thumbnailUrl })
      }
    );
  },

  generationFailedCallback: async (id: string, jobId: string, reason: string, retryable?: boolean): Promise<void> => {
    return performApiRequest<void>(
      `/internal/content/${id}/callbacks/generation-failed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, reason, retryable })
      }
    );
  },

  transcriptionCallback: async (id: string, jobId: string, transcript: string, language?: string): Promise<void> => {
    return performApiRequest<void>(
      `/internal/content/${id}/callbacks/transcription`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, transcript, language })
      }
    );
  },

  getInternalContentById: async (id: string): Promise<ContentDto> => {
    return performApiRequest<ContentDto>(
      `/internal/content/${id}`,
      { method: "GET" }
    );
  }
};

// ==========================================
// 3. FEED SERVICE MODULE
// ==========================================

export interface CommentDto {
  id: string;
  userId: string;
  contentId: string;
  body: string;
  createdAt: string;
}

export interface UserProfileDto {
  userId: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export const feedApi = {
  fetchTrendingTimeline: async (): Promise<any[]> => {
    return performApiRequest(
      "/feed/trending",
      { method: "GET" }
    );
  },

  fetchPersonalFeed: async (cursor?: string, limitCount = 20): Promise<{ items: any[]; nextCursor?: string }> => {
    const safeLimit = Math.min(Math.max(1, limitCount), 100);
    return performApiRequest<{ items: any[]; nextCursor?: string }>(
      `/feed?limit=${safeLimit}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""),
      { method: "GET" }
    );
  },

  getFeedItemById: async (id: string, options?: { suppressErrorLog?: boolean }): Promise<any> => {
    return performApiRequest<any>(
      `/feed/${id}`,
      { method: "GET", ...options }
    );
  },

  likeContent: async (contentId: string) => {
    return performApiRequest(
      `/content/${contentId}/like`,
      { method: "POST" }
    );
  },

  addComment: async (contentId: string, body: string): Promise<CommentDto> => {
    return performApiRequest<CommentDto>(
      `/content/${contentId}/comment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }
    );
  },

  getCommentsList: async (contentId: string, cursor?: string, limitCount = 20): Promise<{ items: CommentDto[]; nextCursor?: string }> => {
    return performApiRequest<{ items: CommentDto[]; nextCursor?: string }>(
      `/content/${contentId}/comments?limit=${limitCount}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""),
      { method: "GET" }
    );
  },

  followUser: async (targetUserId: string): Promise<{ userId: string; following: boolean; followerCount: number }> => {
    return performApiRequest<{ userId: string; following: boolean; followerCount: number }>(
      `/users/${targetUserId}/follow`,
      { method: "POST" }
    );
  },

  getUserProfile: async (userId: string): Promise<UserProfileDto> => {
    return performApiRequest<UserProfileDto>(
      `/users/${userId}/profile`,
      { method: "GET" }
    );
  },

  internalProjections: async (dto: any): Promise<{ contentId: string }> => {
    return performApiRequest<{ contentId: string }>(
      "/internal/feed/projections",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      }
    );
  }
};

// ==========================================
// 4. ANALYTICS SERVICE MODULE
// ==========================================

export interface DashboardMetricsDto {
  views: number;
  likes: number;
  comments: number;
  followers: number;
  reach: number;
}

export interface WeeklyReportDto {
  reportId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  views: number;
  likes: number;
  comments: number;
  followers: number;
  growthRate: number;
}

export const analyticsApi = {
  fetchSummaryMetrics: async (): Promise<DashboardMetricsDto> => {
    return performApiRequest<DashboardMetricsDto>(
      "/analytics/metrics",
      { method: "GET" }
    );
  },

  ingestEvent: async (eventType: string, contentId: string) => {
    return performApiRequest(
      "/analytics/events",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          contentId,
          occurredAt: new Date().toISOString(),
        }),
      }
    );
  },

  fetchLatestWeeklyReport: async (): Promise<WeeklyReportDto> => {
    return performApiRequest<WeeklyReportDto>(
      "/analytics/report/latest",
      { method: "GET" }
    );
  },

  internalIngestEvent: async (eventType: string, contentId: string, userId?: string): Promise<{ eventId: string; status: string }> => {
    return performApiRequest<{ eventId: string; status: string }>(
      "/internal/events",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, contentId, userId, occurredAt: new Date().toISOString() })
      }
    );
  }
};

// ==========================================
// 5. NOTIFICATION SERVICE MODULE
// ==========================================

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferencesDto {
  pushEnabled: boolean;
  inAppEnabled: boolean;
  eventPreferences: {
    [key: string]: boolean;
  };
}

export const notificationApi = {
  registerToken: async (token: string, platform = "web"): Promise<void> => {
    return performApiRequest<void>(
      "/notifications/register-token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform })
      }
    );
  },

  getNotifications: async (cursor?: string, limitCount = 20): Promise<{ items: NotificationDto[]; nextCursor?: string }> => {
    return performApiRequest<{ items: NotificationDto[]; nextCursor?: string }>(
      `/notifications?limit=${limitCount}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""),
      { method: "GET" }
    );
  },

  getPreferences: async (): Promise<NotificationPreferencesDto> => {
    return performApiRequest<NotificationPreferencesDto>(
      "/notifications/preferences",
      { method: "GET" }
    );
  },

  updatePreferences: async (prefs: Partial<NotificationPreferencesDto>): Promise<NotificationPreferencesDto> => {
    return performApiRequest<NotificationPreferencesDto>(
      "/notifications/preferences",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs)
      }
    );
  },

  markAsRead: async (id: string): Promise<NotificationDto> => {
    return performApiRequest<NotificationDto>(
      `/notifications/${id}/read`,
      { method: "PATCH" }
    );
  },

  internalEmit: async (userId: string, eventName: string, payload: any): Promise<void> => {
    return performApiRequest<void>(
      "/internal/emit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eventName, payload })
      }
    );
  }
};

// ==========================================
// 6. CREATOR COACH & ONBOARDING SERVICE MODULE
// ==========================================

export interface CoachQuestionResponse {
  message: string;
  question: number; // 0 = category picker, 1-5 = question index
  category: string | null;
  chips: string[];
  chipLabels?: string[];
  multiSelect: boolean;
  totalQuestions: number;
  answeredCount: number;
  status: "category" | "not_started" | "in_progress" | "ready_for_plan" | "completed";
}

export interface CoachPlanResponse {
  message: string;
  category: string;
  onboardingCompleted: boolean;
  plan: {
    introMessage: string;
    days: Array<{
      day: string;
      icon: string;
      contentType: string;
      theme: string;
    }>;
    recommendedHashtags: string[];
    workspaceTheme: {
      primaryColor: string;
      motivationalQuote: string;
    };
  };
}

export const coachApi = {
  start: async (category?: string, reset = false): Promise<CoachQuestionResponse> => {
    return performApiRequest<CoachQuestionResponse>(
      "/coach/onboarding/start",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, reset })
      }
    );
  },

  getStatus: async (): Promise<CoachQuestionResponse> => {
    return performApiRequest<CoachQuestionResponse>(
      "/coach/onboarding/status",
      { method: "GET" }
    );
  },

  answer: async (question: number, answer: string | string[]): Promise<CoachQuestionResponse> => {
    return performApiRequest<CoachQuestionResponse>(
      "/coach/onboarding/answer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer })
      }
    );
  },

  generatePlan: async (): Promise<CoachPlanResponse> => {
    return performApiRequest<CoachPlanResponse>(
      "/coach/onboarding/generate-plan",
      { method: "POST" }
    );
  }
};
