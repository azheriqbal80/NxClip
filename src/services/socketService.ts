import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./auth/authService";
import { resolveBaseGatewayUrl } from "./apiClient";

export interface GenerationProgressPayload {
  contentId: string;
  progress: number; // 0 to 100
  step?: string;
}

export interface GenerationCompletePayload {
  contentId: string;
  assetUrl: string;
}

export interface GenerationFailedPayload {
  contentId: string;
  reason: string;
  retryable: boolean;
}

export interface ModerationCompletePayload {
  contentId: string;
  status: "approved" | "rejected";
  reason?: string;
}

export interface SubscriptionChangedPayload {
  plan: "FREE" | "PRO" | "STUDIO";
}

export interface CoachTokenPayload {
  token?: string;
  text?: string;
}

export interface CoachProgressPayload {
  message: string;
}

export interface OnboardingCompletePayload {
  userId?: string;
  message?: string;
}

export interface AnalyticsReportReadyPayload {
  reportId?: string;
}

export interface TranscriptionPayload {
  contentId: string;
  transcriptId?: string;
  progress?: number;
}

export interface ContentReadyPayload {
  contentId: string;
}

export type SocketEventPayloadMap = {
  "content:processing": GenerationProgressPayload;
  "content:generation_complete": GenerationCompletePayload;
  "content:generation_failed": GenerationFailedPayload;
  "content:moderation_complete": ModerationCompletePayload;
  "analytics:report_ready": AnalyticsReportReadyPayload;
  "billing:subscription_changed": SubscriptionChangedPayload;
  "onboarding:complete": OnboardingCompletePayload;
  "coach:token": CoachTokenPayload;
  "coach:progress": CoachProgressPayload;
  "content:transcribing": TranscriptionPayload;
  "content:transcription_complete": TranscriptionPayload;
  "content:captions_ready": ContentReadyPayload;
  "content:polish_complete": ContentReadyPayload;
};

export type SupportedSocketEvent = keyof SocketEventPayloadMap;

// Notification-service may emit either a direct payload or an envelope with metadata.
export type WebSocketEnvelope<T> = T & {
  notificationId?: string;
  data?: T;
};

export type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

type StatusCallback = (status: SocketStatus) => void;
type SocketPayload = WebSocketEnvelope<SocketEventPayloadMap[SupportedSocketEvent]>;
type EventCallback = (event: SupportedSocketEvent, payload: SocketPayload) => void;

const SUPPORTED_SOCKET_EVENTS: SupportedSocketEvent[] = [
  "content:processing",
  "content:generation_complete",
  "content:generation_failed",
  "content:moderation_complete",
  "analytics:report_ready",
  "billing:subscription_changed",
  "onboarding:complete",
  "coach:token",
  "coach:progress",
  "content:transcribing",
  "content:transcription_complete",
  "content:captions_ready",
  "content:polish_complete",
];

class SocketService {
  private socket: Socket | null = null;
  private status: SocketStatus = "disconnected";
  private statusCallbacks: Set<StatusCallback> = new Set();
  private eventCallbacks: Map<SupportedSocketEvent, Set<EventCallback>> = new Map();
  private lastToken = "";

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("nx_auth_state_changed", this.handleAuthStateChange);
      this.init();
    }
  }

  /**
   * Initialize and connect the Socket.IO client
   */
  public init(): void {
    if (this.socket) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.log("[SocketService] No token found. Delaying connection...");
      this.lastToken = "";
      this.updateStatus("disconnected");
      return;
    }

    try {
      this.lastToken = token;
      this.updateStatus("connecting");
      const wsUrl = this.resolveSocketUrl();

      console.log(`[SocketService] Initiating handshake with Live Notifications Service: ${wsUrl}`);

      this.socket = io(wsUrl, {
        auth: { token },
        withCredentials: true,
        transports: ["websocket"],
        autoConnect: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000,
      });

      this.setupListeners();
    } catch (err) {
      console.warn("[SocketService] Failed to establish native socket:", err);
      this.updateStatus("error");
    }
  }

  /**
   * Sets up native Socket.IO listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[SocketService] Connected to Notification Service WebSocket chamber.");
      this.updateStatus("connected");
    });

    this.socket.on("connect_error", (error) => {
      console.warn("[SocketService] Handshake connection error:", error.message);
      this.updateStatus("error");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketService] Disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server kicked client, try reconnecting manually
        this.socket?.connect();
      } else {
        this.updateStatus("disconnected");
      }
    });

    SUPPORTED_SOCKET_EVENTS.forEach((eventName) => {
      this.socket?.on(eventName, (data) => {
        console.log(`[SocketService] Received live event [${eventName}]:`, data);
        this.triggerEventCallbacks(eventName, data as SocketPayload);
      });
    });
  }

  /**
   * Register a callback for WebSocket status updates
   */
  public onStatusChange(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    cb(this.status); // Immediately inform the current status
    return () => {
      this.statusCallbacks.delete(cb);
    };
  }

  /**
   * Subscribe to specific WebSocket events
   */
  public subscribe(eventName: SupportedSocketEvent, cb: EventCallback): () => void {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, new Set());
    }
    this.eventCallbacks.get(eventName)!.add(cb);

    return () => {
      const callbacks = this.eventCallbacks.get(eventName);
      if (callbacks) {
        callbacks.delete(cb);
        if (callbacks.size === 0) {
          this.eventCallbacks.delete(eventName);
        }
      }
    };
  }

  /**
   * Alias method for event subscription
   */
  public on<TEvent extends SupportedSocketEvent>(
    eventName: TEvent,
    cb: (payload: WebSocketEnvelope<SocketEventPayloadMap[TEvent]>) => void
  ): void {
    const wrappedCb: EventCallback = (_evt, payload) => cb(payload as WebSocketEnvelope<SocketEventPayloadMap[TEvent]>);
    Object.defineProperty(cb, "__nxSocketWrapped", {
      configurable: true,
      value: wrappedCb,
    });
    this.subscribe(eventName, wrappedCb);
  }

  /**
   * Alias method to unsubscribe event listener
   */
  public off<TEvent extends SupportedSocketEvent>(
    eventName: TEvent,
    cb: (payload: WebSocketEnvelope<SocketEventPayloadMap[TEvent]>) => void
  ): void {
    const targetCb = (cb as { __nxSocketWrapped?: EventCallback }).__nxSocketWrapped;
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach((storedCb) => {
        if (targetCb && storedCb === targetCb) {
          callbacks.delete(storedCb);
        }
      });
      if (callbacks.size === 0) {
        this.eventCallbacks.delete(eventName);
      }
    }
  }

  /**
   * Refreshes the token and reconnects native socket
   */
  public updateToken(): void {
    console.log("[SocketService] Re-attuning WebSocket credentials...");
    this.disconnect();
    this.init();
  }

  /**
   * Disconnect the socket
   */
  public disconnect(): void {
    this.cleanupNative();
    this.lastToken = "";
    this.updateStatus("disconnected");
  }

  private cleanupNative(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private updateStatus(newStatus: SocketStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusCallbacks.forEach((cb) => cb(this.status));
  }

  private triggerEventCallbacks(eventName: SupportedSocketEvent, payload: SocketPayload): void {
    // Notify general catch-all wildcards or target callbacks
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach((cb) => cb(eventName, payload));
    }
  }

  public getStatus(): SocketStatus {
    return this.status;
  }

  private resolveSocketUrl(): string {
    const configuredSocketUrl = import.meta.env.VITE_NOTIFICATION_SOCKET_URL;
    if (configuredSocketUrl) {
      return configuredSocketUrl;
    }

    const gatewayUrl = resolveBaseGatewayUrl();
    if (gatewayUrl.includes("localhost") || gatewayUrl.includes("127.0.0.1")) {
      return "http://localhost:5006/events";
    }

    return `${gatewayUrl.replace(/\/+$/, "")}/events`;
  }

  private handleAuthStateChange = (): void => {
    const nextToken = getAccessToken();
    if (!nextToken) {
      if (this.socket || this.status !== "disconnected") {
        this.disconnect();
      }
      return;
    }

    if (!this.socket) {
      this.init();
      return;
    }

    if (nextToken !== this.lastToken) {
      this.updateToken();
    }
  };
}

// Export single instances for unified connection tracking
export const socketService = new SocketService();
