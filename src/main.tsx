import './polyfill';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './i18n';
import { safeLocalStorage } from './lib/safeStorage';

// Safe global console interceptor to prevent iframe postMessage serialization crashes on circular structures
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

function sanitizeConsoleArg(arg: any, seen = new WeakSet()): any {
  if (arg === null || typeof arg !== "object") {
    return arg;
  }

  if (seen.has(arg)) {
    return "[Circular]";
  }

  if (arg instanceof HTMLElement || (arg.constructor && arg.constructor.name && arg.constructor.name.includes("HTML"))) {
    return `[HTMLElement: ${arg.tagName || arg.constructor.name}]`;
  }

  if (arg === window || arg === document) {
    return "[Global Browser Object]";
  }

  seen.add(arg);

  if (arg instanceof Error) {
    const errorDetails: Record<string, any> = {
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
    if (arg.cause) {
      errorDetails.cause = sanitizeConsoleArg(arg.cause, seen);
    }
    return errorDetails;
  }

  if (Array.isArray(arg)) {
    return arg.map((item) => sanitizeConsoleArg(item, seen));
  }

  const sanitized: Record<string, any> = {};
  const keys = Object.keys(arg);
  for (const key of keys) {
    try {
      if (key.startsWith("_")) {
        sanitized[key] = `[Internal ${key}]`;
      } else {
        sanitized[key] = sanitizeConsoleArg(arg[key], seen);
      }
    } catch {
      sanitized[key] = "[Unreadable Property]";
    }
  }
  return sanitized;
}

console.log = (...args: any[]) => {
  try {
    originalConsoleLog(...args.map((arg) => sanitizeConsoleArg(arg)));
  } catch {
    originalConsoleLog("[Circular Console Log Bypassed]");
  }
};

console.error = (...args: any[]) => {
  try {
    originalConsoleError(...args.map((arg) => sanitizeConsoleArg(arg)));
  } catch {
    originalConsoleError("[Circular Console Error Bypassed]");
  }
};

console.warn = (...args: any[]) => {
  try {
    originalConsoleWarn(...args.map((arg) => sanitizeConsoleArg(arg)));
  } catch {
    originalConsoleWarn("[Circular Console Warn Bypassed]");
  }
};

console.info = (...args: any[]) => {
  try {
    originalConsoleInfo(...args.map((arg) => sanitizeConsoleArg(arg)));
  } catch {
    originalConsoleInfo("[Circular Console Info Bypassed]");
  }
};

// Global window.fetch adapter to redirect direct external gateway fetches through the proxy
const originalFetch = (window.fetch || (globalThis && globalThis.fetch)).bind(window);

async function mockedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let finalInput = input;
  const apiEnv = safeLocalStorage.getItem("nxclip_api_env") || "development";

  let rewrittenUrl = typeof input === "string" 
    ? input 
    : input instanceof URL 
      ? input.toString() 
      : (input ? (input as any).url : "");

  if (apiEnv !== "development") {
    const defaultDevUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
    const newBase = apiEnv === "staging" ? "https://staging-api.nxclip.ai" : "https://api.nxclip.ai";

    if (typeof input === "string") {
      let targetUrl = input;
      if (input.startsWith(defaultDevUrl)) {
        targetUrl = input.replace(defaultDevUrl, newBase);
      } else if (input.startsWith("/api/")) {
        targetUrl = newBase + input;
      } else if (input.startsWith("http://localhost:3000/api/")) {
        targetUrl = input.replace("http://localhost:3000", newBase);
      }
      rewrittenUrl = targetUrl;
      finalInput = targetUrl;
    } else if (input instanceof URL) {
      let targetStr = input.toString();
      if (targetStr.startsWith(defaultDevUrl)) {
        targetStr = targetStr.replace(defaultDevUrl, newBase);
      } else if (targetStr.startsWith("/api/")) {
        targetStr = newBase + targetStr;
      }
      rewrittenUrl = targetStr;
      finalInput = new URL(targetStr);
    } else if (input && typeof (input as any).url === "string") {
      const reqUrl = (input as any).url;
      let targetUrl = reqUrl;
      if (reqUrl.startsWith(defaultDevUrl)) {
        targetUrl = reqUrl.replace(defaultDevUrl, newBase);
      } else if (reqUrl.startsWith("/api/")) {
        targetUrl = newBase + reqUrl;
      } else if (reqUrl.startsWith("http://localhost:3000/api/")) {
        targetUrl = reqUrl.replace("http://localhost:3000", newBase);
      }
      rewrittenUrl = targetUrl;
      try {
        finalInput = new Request(targetUrl, input as RequestInit);
      } catch {
        finalInput = targetUrl;
      }
    }
  }

  const url = rewrittenUrl;

  if (url.includes("staging-api.nxclip.ai") || url.includes("api.nxclip.ai")) {
    const isStaging = url.includes("staging-api.nxclip.ai");
    const targetBase = isStaging ? "https://staging-api.nxclip.ai" : "https://api.nxclip.ai";
    const subPath = url.substring(url.indexOf(targetBase) + targetBase.length);
    const proxyUrl = `/api/gateway-proxy/${subPath.replace(/^\/+/, "")}`;
    
    const modifiedInit = { ...(init || {}) };
    const headers = new Headers(modifiedInit.headers || {});
    headers.set("X-Target-Gateway-Url", targetBase);
    modifiedInit.headers = headers;
    
    return originalFetch(proxyUrl, modifiedInit);
  }

  return originalFetch(finalInput, init);
}

try {
  Object.defineProperty(window, "fetch", {
    value: mockedFetch,
    configurable: true,
    writable: true,
    enumerable: true
  });
} catch (e) {
  try {
    (window as any).fetch = mockedFetch;
  } catch (e2) {
    console.warn("Unable to redefine window.fetch, falling back to globalThis:", e2);
  }
}

try {
  Object.defineProperty(globalThis, "fetch", {
    value: mockedFetch,
    configurable: true,
    writable: true,
    enumerable: true
  });
} catch (e) {
  try {
    (globalThis as any).fetch = mockedFetch;
  } catch (e2) {
    // final silent fallback
  }
}

import { Provider } from "react-redux";
import { store } from "./store";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
