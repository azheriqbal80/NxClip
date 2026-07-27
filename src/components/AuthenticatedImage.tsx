import { useState, useEffect } from "react";
import { getAccessToken } from "../services/auth/authService";
import { resolveBaseGatewayUrl } from "../services/apiClient";

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
}

export function AuthenticatedImage({ src, fallbackSrc, className, alt, onError, ...props }: AuthenticatedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = "";

    const logFallbackUsage = (reason: string, errorDetail?: any) => {
      console.warn(
        `%c🖼️ [nxclip.ai Image Studio] %c⚠️ WE ARE USING A FALLBACK IMAGE ⚠️`,
        "color: #a855f7; font-weight: bold; font-size: 13px;",
        "color: #eab308; font-weight: bold; font-size: 13px; background-color: rgba(234, 179, 8, 0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(234, 179, 8, 0.2);"
      );
      console.warn(
        `%c▶ Target Auth URL:%c ${src}`,
        "color: #94a3b8; font-weight: bold;",
        "color: #38bdf8; font-family: monospace; font-weight: normal;"
      );
      console.warn(
        `%c▶ Fallback URL:  %c ${fallbackSrc || "None provided"}`,
        "color: #94a3b8; font-weight: bold;",
        "color: #10b981; font-family: monospace; font-weight: normal;"
      );
      console.warn(
        `%c▶ Error Cause:   %c ${reason}`,
        "color: #f87171; font-weight: bold;",
        "color: #f87171; font-family: monospace; font-weight: 500;"
      );
      if (errorDetail) {
        console.warn(
          `%c▶ Error Object:  `,
          "color: #f87171; font-weight: bold;",
          errorDetail
        );
      }
      console.warn(
        `%c=======================================================`,
        "color: #4b5563;"
      );
    };

    const loadImg = async () => {
      if (!src) {
        setResolvedSrc(undefined);
        setLoading(false);
        return;
      }

      const baseGateway = resolveBaseGatewayUrl();
      const raw = src.trim();

      // Resolve the gateway sub-path for auth-required media resources.
      let subPath: string | null = null;
      if (raw.startsWith("/content/")) {
        subPath = raw.replace(/^\/+/, "");
      } else if (raw.startsWith(baseGateway)) {
        subPath = raw.substring(baseGateway.length).replace(/^\/+/, "");
      } else if (raw.includes("api-gateway") && raw.includes("/content/")) {
        try {
          const u = new URL(raw);
          subPath = (u.pathname + u.search).replace(/^\/+/, "");
        } catch {
          subPath = null;
        }
      }

      const isAuthMedia = !!subPath && subPath.includes("content/") && subPath.includes("/media");

      if (!isAuthMedia) {
        // Public / external URL — use directly.
        if (isMounted) {
          setResolvedSrc(raw);
          setLoading(false);
        }
        return;
      }

      const token = getAccessToken();

      try {
        setLoading(true);
        // Route through the same-origin dev proxy to avoid CORS to the Cloud Run gateway.
        // The proxy forwards the Bearer token and streams the binary bytes back.
        const proxyUrl = `/api/gateway-proxy/${subPath}`;
        const headers: Record<string, string> = { "X-Target-Gateway-Url": baseGateway };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(proxyUrl, { headers });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} (${response.statusText || "media fetch failed"})`);
        }

        const blob = await response.blob();
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedSrc(objectUrl);
        }
      } catch (error: any) {
        logFallbackUsage(error?.message || "Failed to fetch private media via gateway proxy.", error);
        if (isMounted) {
          setResolvedSrc(fallbackSrc || undefined);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadImg();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, fallbackSrc]);

  if (!resolvedSrc) {
    return <div className={className} />;
  }

  return (
    <img
      src={resolvedSrc}
      className={className}
      alt={alt}
      onError={(e) => {
        if (fallbackSrc && resolvedSrc !== fallbackSrc) {
          setResolvedSrc(fallbackSrc);
        } else if (onError) {
          onError(e);
        }
      }}
      {...props}
    />
  );
}

