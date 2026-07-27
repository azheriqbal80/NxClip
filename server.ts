import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI Proxy
  app.post("/api/ai/generate", async (req, res) => {
    const { model, contents, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    try {
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      
      res.json({ 
        text: response.text,
        candidates: response.candidates 
      });
    } catch (error: any) {
      const isQuota = error?.status === "RESOURCE_EXHAUSTED" || 
                      error?.status === 429 || 
                      error?.message?.includes("RESOURCE_EXHAUSTED") || 
                      error?.message?.includes("429") || 
                      error?.message?.includes("Quota exceeded");

      if (!isQuota) {
        console.error("Gemini API error:", error?.message || error);
      } else {
        console.log("[AI Node] Quota limit reached for text generation.");
      }

      res.status(isQuota ? 429 : 500).json({ 
        error: isQuota 
          ? "Gemini AI quota exceeded. Please try again in a few minutes." 
          : (error?.message || "Failed to generate content from Gemini"),
        isQuotaExhausted: isQuota,
        details: error
      });
    }
  });

  // Image Studio generation must use the Content Service (`POST /content/generate`).
  // Keep this legacy route disabled so the app cannot silently serve fallback/mock images.
  app.post("/api/ai/generate-image", async (req, res) => {
    return res.status(410).json({
      error: "Legacy image generation endpoint is disabled. Use POST /content/generate through the Content Service.",
    });
  });

  // API Proxy for Pexels
  app.get("/api/pexels/search", async (req, res) => {
    const { query = "gaming", per_page = 15, page = 1 } = req.query;
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "PEXELS_API_KEY is not configured" });
    }

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${query}&per_page=${per_page}&page=${page}`,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Pexels API error:", error);
      res.status(500).json({ error: "Failed to fetch from Pexels" });
    }
  });

  // Serve migration guide dynamic markdown
  app.get("/api/docs/migration-guide", async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const filePath = path.join(process.cwd(), "docs", "nxclip-migration-guide.md");
      const markdown = await fs.readFile(filePath, "utf-8");
      res.json({ content: markdown });
    } catch (error) {
      console.error("Error reading migration guide:", error);
      res.status(500).json({ error: "Failed to read migration guide markdown file" });
    }
  });

  // Local health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
  });

  // Generic API Gateway Proxy to bypass CORS on the browser
  app.all("/api/gateway-proxy/*", async (req, res) => {
    const subPath = req.params[0] || req.path.replace(/^\/api\/gateway-proxy/, "");
    const targetGatewayUrl = req.headers["x-target-gateway-url"] as string || "https://api-gateway-216098834386.us-central1.run.app";
    
    // Construct the full destination URL, maintaining any query params
    const queryStr = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
    const destinationUrl = `${targetGatewayUrl.replace(/\/+$/, "")}/${subPath.replace(/^\/+/, "")}${queryStr}`;

    // --- ARCHITECTURAL CONFORMITY CHECKLIST ENFORCEMENT ENGINE ---
    
    // 1. Trace Correlation ID Injection & Verification (Migration Guide Sec. 1.1)
    let correlationId = req.headers["x-correlation-id"] as string;
    if (!correlationId) {
      correlationId = `trace_gateway_auto_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      req.headers["x-correlation-id"] = correlationId;
    }

    // Helper to format consistent error contract (Distributed Error Propagation Standard)
    const sendErrorResponse = (statusCode: number, message: string, code: string) => {
      return res.status(statusCode).json({
        statusCode,
        message,
        correlationId,
        code,
        timestamp: new Date().toISOString()
      });
    };

    // 2. Request DTO Schema Validation (Frontend Integration Guide Sec. 3)
    const cleanSubPath = subPath.replace(/^\/+/, "");
    if (req.method === "POST" && req.body && typeof req.body === "object") {
      const body = req.body;
      
      // A. RegisterRequest validation
      if (cleanSubPath === "auth/register") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!body.email || !emailRegex.test(body.email)) {
          return sendErrorResponse(400, "Conformity Violation: Invalid email format. Must satisfy standard email address validation.", "CONFORMITY_ERR_INVALID_EMAIL");
        }
        if (!body.username || body.username.length < 3 || body.username.length > 64 || !usernameRegex.test(body.username)) {
          return sendErrorResponse(400, "Conformity Violation: Username must be 3-64 characters containing only letters, numbers, or underscores.", "CONFORMITY_ERR_INVALID_USERNAME");
        }
        if (!body.displayName || body.displayName.length > 100) {
          return sendErrorResponse(400, "Conformity Violation: Display name is required and must be 1-100 characters.", "CONFORMITY_ERR_INVALID_DISPLAY_NAME");
        }
        if (!body.password || body.password.length < 8 || body.password.length > 128) {
          return sendErrorResponse(400, "Conformity Violation: Password must be 8-128 characters long.", "CONFORMITY_ERR_INVALID_PASSWORD");
        }
      }
      
      // B. LoginRequest validation
      if (cleanSubPath === "auth/login") {
        if (!body.email || !body.password) {
          return sendErrorResponse(400, "Conformity Violation: Missing email or password credentials in request payload.", "CONFORMITY_ERR_MISSING_CREDENTIALS");
        }
      }

      // C. GenerateImageRequest validation
      if (cleanSubPath === "content/generate") {
        if (!body.prompt || body.prompt.length < 3 || body.prompt.length > 2000) {
          return sendErrorResponse(400, "Conformity Violation: AI prompt is required and must be between 3 and 2000 characters.", "CONFORMITY_ERR_INVALID_PROMPT");
        }
        if (body.aspectRatio && !["1:1", "16:9", "9:16"].includes(body.aspectRatio)) {
          return sendErrorResponse(400, "Conformity Violation: Aspect ratio must be exactly '1:1', '16:9', or '9:16'.", "CONFORMITY_ERR_INVALID_ASPECT_RATIO");
        }
      }

      // D. IngestEventRequest validation
      if (cleanSubPath === "analytics/events") {
        const allowedEvents = ["VIEW", "LIKE", "COMMENT", "FOLLOW", "SHARE", "CONTENT_PUBLISHED"];
        if (!body.eventType || !allowedEvents.includes(body.eventType)) {
          return sendErrorResponse(400, `Conformity Violation: Event type must be one of: ${allowedEvents.join(", ")}`, "CONFORMITY_ERR_INVALID_EVENT_TYPE");
        }
        if (!body.contentId) {
          return sendErrorResponse(400, "Conformity Violation: contentId is a required UUID parameter for event ingestion.", "CONFORMITY_ERR_MISSING_CONTENT_ID");
        }
      }
    }

    // 3. Dynamic Gateway Path Splitting (Gateway Routing Standard)
    // Intercept engagement and follow paths out to feed-service (port 5003) if they target a localhost address.
    let finalDestinationUrl = destinationUrl;
    let routedService = "cloud-gateway";

    if (targetGatewayUrl.includes("localhost") || targetGatewayUrl.includes("127.0.0.1")) {
      // Check for feed-service engagement or follow routes
      const isFeedEngagement = 
        /^(content|users)\/[^\/]+\/(like|comment|comments|follow|profile)/.test(cleanSubPath) ||
        cleanSubPath.startsWith("feed");

      if (isFeedEngagement) {
        finalDestinationUrl = `http://localhost:5003/${cleanSubPath}${queryStr}`;
        routedService = "feed-service (5003)";
      } else if (cleanSubPath.startsWith("auth") || cleanSubPath === "users/me" || cleanSubPath.startsWith("users/me/")) {
        finalDestinationUrl = `http://localhost:5001/${cleanSubPath}${queryStr}`;
        routedService = "identity-service (5001)";
      } else if (cleanSubPath.startsWith("content")) {
        finalDestinationUrl = `http://localhost:5002/${cleanSubPath}${queryStr}`;
        routedService = "content-service (5002)";
      } else if (cleanSubPath.startsWith("analytics")) {
        finalDestinationUrl = `http://localhost:5005/${cleanSubPath}${queryStr}`;
        routedService = "analytics-service (5005)";
      } else if (cleanSubPath.startsWith("notifications")) {
        finalDestinationUrl = `http://localhost:5006/${cleanSubPath}${queryStr}`;
        routedService = "notification-service (5006)";
      } else if (cleanSubPath.startsWith("ai-coach")) {
        finalDestinationUrl = `http://localhost:5004/${cleanSubPath}${queryStr}`;
        routedService = "ai-coach-service (5004)";
      } else if (cleanSubPath.startsWith("users/")) {
        if (cleanSubPath.endsWith("/profile")) {
          finalDestinationUrl = `http://localhost:5003/${cleanSubPath}${queryStr}`;
          routedService = "feed-service (5003)";
        } else {
          finalDestinationUrl = `http://localhost:5001/${cleanSubPath}${queryStr}`;
          routedService = "identity-service (5001)";
        }
      }
    } else {
      // In cloud mode, check if we need to split engagement/follow requests
      // Note: If no custom cloud feed service URL is configured, we route to the default cloud gateway base.
      const isFeedEngagement = 
        /^(content|users)\/[^\/]+\/(like|comment|comments|follow|profile)/.test(cleanSubPath) ||
        cleanSubPath.startsWith("feed");
      
      if (isFeedEngagement) {
        routedService = "cloud-feed-service-split";
      }
    }

    console.log(`[Gateway Proxy] Forwarding ${req.method} request to: ${finalDestinationUrl} [Resolved via ${routedService}]`);

    try {
      // Build safe headers to pass through (ignore browser-specific CORS headers to mimic Postman)
      const headersToForward: Record<string, string> = {};
      const ignoredRequestHeaders = [
        "host",
        "connection",
        "accept-encoding",
        "content-length",
        "origin",
        "referer",
        "sec-fetch-dest",
        "sec-fetch-mode",
        "sec-fetch-site",
        "sec-fetch-user",
        "sec-ch-ua",
        "sec-ch-ua-mobile",
        "sec-ch-ua-platform"
      ];
      
      Object.entries(req.headers).forEach(([key, value]) => {
        if (!ignoredRequestHeaders.includes(key.toLowerCase()) && value !== undefined) {
          headersToForward[key] = Array.isArray(value) ? value.join(", ") : value;
        }
      });

      // Ensure correlation ID is forwarded
      headersToForward["x-correlation-id"] = correlationId;

      // Avoid passing body for GET/HEAD or empty requests
      const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.body && Object.keys(req.body).length > 0;

      // Media routes (e.g. /content/{id}/media) return binary bytes, or a 302 to a
      // signed GCS URL. Fetch as binary (and follow the redirect) so we can stream the
      // bytes straight back instead of corrupting them via JSON parsing.
      const isMediaRequest = /\/media$/.test(cleanSubPath.split("?")[0]);

      let response;
      try {
        response = await axios({
          url: finalDestinationUrl,
          method: req.method as any,
          headers: headersToForward,
          data: hasBody ? req.body : undefined,
          responseType: isMediaRequest ? "arraybuffer" : "json",
          validateStatus: () => true, // Forward all status codes to client rather than throwing
        });
      } catch (axiosError: any) {
        // Catch network and resolution errors (e.g., DNS ENOTFOUND, ECONNREFUSED, ETIMEDOUT)
        const isStaging = finalDestinationUrl.includes("staging-api.nxclip.ai");
        const isNetworkError = 
          axiosError.code === "ENOTFOUND" || 
          axiosError.code === "ECONNREFUSED" || 
          axiosError.code === "ETIMEDOUT" || 
          !axiosError.response || 
          axiosError.message?.includes("ENOTFOUND");

        if (isStaging && isNetworkError) {
          console.warn(`[Gateway Proxy] Staging gateway (staging-api.nxclip.ai) failed with ${axiosError.code || "network error"}. Falling back to production gateway.`);
          const fallbackProdUrl = "https://api-gateway-216098834386.us-central1.run.app";
          const fallbackUrl = finalDestinationUrl.replace("https://staging-api.nxclip.ai", fallbackProdUrl);
          
          console.log(`[Gateway Proxy] Retrying forwarding ${req.method} request to: ${fallbackUrl}`);
          response = await axios({
            url: fallbackUrl,
            method: req.method as any,
            headers: headersToForward,
            data: hasBody ? req.body : undefined,
            responseType: isMediaRequest ? "arraybuffer" : "json",
            validateStatus: () => true,
          });
        } else {
          throw axiosError;
        }
      }

      // Set headers from response, but ignore ones modified by decompression or handled by reverse proxy
      const ignoredResponseHeaders = [
        "content-encoding",
        "transfer-encoding",
        "connection",
        "content-length",
        "keep-alive",
        "access-control-allow-origin",
        "access-control-allow-credentials",
        "access-control-allow-methods",
        "access-control-allow-headers"
      ];

      Object.entries(response.headers).forEach(([key, value]) => {
        if (!ignoredResponseHeaders.includes(key.toLowerCase()) && value !== undefined) {
          res.setHeader(key, Array.isArray(value) ? value.join(", ") : (value as any));
        }
      });

      // Binary media: stream the fetched bytes straight back (skip JSON normalization).
      if (isMediaRequest && response.status < 400) {
        return res.status(response.status).send(Buffer.from(response.data));
      }

      // 4. Distributed Error Propagation Normalizer
      // Ensure all 4xx and 5xx responses conform to the 5-key structure
      if (response.status >= 400) {
        let responseData = response.data;
        if (!responseData || typeof responseData !== "object" || !responseData.statusCode || !responseData.message) {
          responseData = {
            statusCode: response.status,
            message: (typeof responseData === "string" ? responseData : null) || responseData?.error || responseData?.message || `Upstream service error code ${response.status}`,
            correlationId,
            code: responseData?.code || `UPSTREAM_ERROR_${response.status}`,
            timestamp: responseData?.timestamp || new Date().toISOString()
          };
        } else {
          // Upstream returned a valid structured error, make sure correlationId is stamped
          if (!responseData.correlationId) {
            responseData.correlationId = correlationId;
          }
        }
        return res.status(response.status).json(responseData);
      }

      res.status(response.status).send(response.data);
    } catch (error: any) {
      console.error("[Gateway Proxy] Proxy error:", error);
      // Return normalized 502 Bad Gateway conformant error
      return sendErrorResponse(
        502,
        `Gateway proxy integration failure: ${error?.message || "Unknown error"}`,
        "BAD_GATEWAY"
      );
    }
  });

  // API Proxy for health checks to bypass CORS
  app.get("/api/proxy-health", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing target 'url' parameter" });
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid URL protocol. Only http and https are supported." });
    }

    console.log(`[Proxy] Health check request to: ${url}`);

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "nxclip-api-proxy/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(id);

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      let data = null;
      if (isJson) {
        data = await response.json().catch(() => null);
      } else {
        data = { text: await response.text().catch(() => "") };
      }

      res.status(response.status).json({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        proxySource: "nxclip-server",
        targetUrl: url,
        data,
      });
    } catch (error: any) {
      const isTimeout = error?.name === "AbortError" || error?.message?.toLowerCase().includes("abort") || error?.message?.toLowerCase().includes("signal");
      res.status(504).json({
        ok: false,
        status: 504,
        statusText: isTimeout ? "Gateway Timeout" : "Bad Gateway",
        proxySource: "nxclip-server",
        targetUrl: url,
        error: error?.message || "Unknown error connecting to target gateway",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
