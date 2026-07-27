// polyfill.ts
// Executes immediately at the very beginning of application lifecycle to prevent
// SecurityError/DOMException crashes when accessing localStorage or sessionStorage
// in sandboxed iframe environments where third-party storage access is disabled,
// and intercept untraceable cross-origin host errors ("Script error.").

(function initStoragePolyfill() {
  // 1. Intercept and silence cross-origin "Script error." and third-party extension failures
  // that propagate to the iframe's global window from the parent frame/host environment.
  if (typeof window !== "undefined") {
    // A helper to determine if an error is a cross-origin Script error or from browser extensions
    const isErrorOrRejectCrossOrigin = (msg: string, filename: string, errorStr: string, reasonStr: string): boolean => {
      const lowerMsg = msg.toLowerCase();
      const lowerErr = errorStr.toLowerCase();
      const lowerReason = reasonStr.toLowerCase();
      const lowerFilename = filename.toLowerCase();

      return (
        lowerMsg.includes("script error") ||
        lowerErr.includes("script error") ||
        lowerReason.includes("script error") ||
        lowerFilename.includes("chrome-extension") ||
        lowerFilename.includes("moz-extension") ||
        lowerFilename.includes("extensions/") ||
        // If there's no filename and message/error is blank, it's typically an obscured cross-origin error
        (!filename && !msg && !errorStr && !reasonStr)
      );
    };

    // Capturing phase listener: intercepts error events before they propagate to other listeners or the host
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message ? String(event.message) : "";
      const filename = event.filename ? String(event.filename) : "";
      const errorStr = event.error ? String(event.error) : "";
      
      if (isErrorOrRejectCrossOrigin(msg, filename, errorStr, "")) {
        console.warn("[Sandbox Interceptor] Ignored cross-origin host/extension error:", msg || "Script error");
        try {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("error", handleGlobalError, true);

    // Redefine window.onerror with a property descriptor to ensure our filter runs first
    // even if other libraries override window.onerror later.
    let currentOnError: typeof window.onerror = null;

    const customOnError = function (
      message: Event | string,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) {
      const msgStr = String(message || "");
      const srcStr = String(source || "");
      const errStr = error ? String(error.message || error) : "";
      
      if (isErrorOrRejectCrossOrigin(msgStr, srcStr, errStr, "")) {
        console.warn("[Sandbox Interceptor] Ignored cross-origin host/extension window.onerror:", msgStr || "Script error");
        return true; // Silence error reporting
      }
      if (currentOnError) {
        try {
          return currentOnError.apply(window, [message, source, lineno, colno, error]);
        } catch {
          return false;
        }
      }
      return false;
    };

    // Store existing handler
    currentOnError = window.onerror;

    try {
      Object.defineProperty(window, "onerror", {
        get() {
          return customOnError;
        },
        set(val) {
          if (val === customOnError) return;
          currentOnError = val;
        },
        configurable: true
      });
    } catch {
      window.onerror = customOnError;
    }

    // Handle unhandled promise rejections from foreign origins or extensions
    window.addEventListener("unhandledrejection", (event) => {
      try {
        const reason = event.reason;
        if (reason) {
          const reasonStr = String(reason.stack || reason.message || reason || "");
          if (isErrorOrRejectCrossOrigin("", "", "", reasonStr)) {
            console.warn("[Sandbox Interceptor] Ignored extension promise rejection:", reasonStr);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
        }
      } catch {
        // Safe bypass
      }
    }, true);

    // Overriding EventTarget.prototype.addEventListener/removeEventListener to filter
    // error listeners registered by other libraries or framework runtimes.
    if (typeof EventTarget !== "undefined" && EventTarget.prototype) {
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;

      // WeakMap to associate original listener functions with their filtered wrappers
      const listenerMap = new WeakMap<any, any>();

      EventTarget.prototype.addEventListener = function (
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
      ) {
        if ((type === "error" || type === "unhandledrejection") && listener) {
          // Create wrapper
          const wrappedListener = function (this: any, event: any) {
            try {
              let isScriptError = false;
              if (type === "error") {
                const msg = event.message ? String(event.message) : "";
                const filename = event.filename ? String(event.filename) : "";
                const errorStr = event.error ? String(event.error) : "";
                if (isErrorOrRejectCrossOrigin(msg, filename, errorStr, "")) {
                  isScriptError = true;
                }
              } else if (type === "unhandledrejection") {
                const reason = event.reason;
                if (reason) {
                  const reasonStr = String(reason.stack || reason.message || reason || "");
                  if (isErrorOrRejectCrossOrigin("", "", "", reasonStr)) {
                    isScriptError = true;
                  }
                }
              }

              if (isScriptError) {
                console.warn(`[Sandbox Interceptor] Prevented propagation of cross-origin ${type} event to listener:`, event);
                try {
                  event.preventDefault();
                  event.stopPropagation();
                  event.stopImmediatePropagation();
                } catch {
                  // ignore
                }
                return; // Suppress calling the registered listener
              }
            } catch {
              // Safe bypass
            }

            // Call original listener
            if (typeof listener === "function") {
              return listener.call(this, event);
            } else if (listener && typeof (listener as any).handleEvent === "function") {
              return (listener as any).handleEvent(event);
            }
          };

          listenerMap.set(listener, wrappedListener);
          return originalAdd.call(this, type, wrappedListener, options);
        }

        return originalAdd.call(this, type, listener, options);
      };

      EventTarget.prototype.removeEventListener = function (
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions
      ) {
        if ((type === "error" || type === "unhandledrejection") && listener) {
          const wrapped = listenerMap.get(listener);
          if (wrapped) {
            listenerMap.delete(listener);
            return originalRemove.call(this, type, wrapped, options);
          }
        }
        return originalRemove.call(this, type, listener, options);
      };
    }
  }

  let storageBlocked = false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch {
    storageBlocked = true;
  }

  if (storageBlocked) {
    console.warn("[Storage Polyfill] Access to localStorage/sessionStorage is blocked. Installing in-memory fallbacks.");

    const createMemoryStorage = () => {
      let store: Record<string, string> = {};
      return {
        getItem(key: string): string | null {
          return store[key] !== undefined ? store[key] : null;
        },
        setItem(key: string, value: string): void {
          store[key] = String(value);
        },
        removeItem(key: string): void {
          delete store[key];
        },
        clear(): void {
          store = {};
        },
        key(index: number): string | null {
          return Object.keys(store)[index] || null;
        },
        get length(): number {
          return Object.keys(store).length;
        }
      };
    };

    const mockLocalStorage = createMemoryStorage();
    const mockSessionStorage = createMemoryStorage();

    // Redefine getters on Window.prototype if possible
    try {
      Object.defineProperty(Window.prototype, "localStorage", {
        get: () => mockLocalStorage,
        configurable: true
      });
      Object.defineProperty(Window.prototype, "sessionStorage", {
        get: () => mockSessionStorage,
        configurable: true
      });
    } catch {
      try {
        Object.defineProperty(window, "localStorage", {
          value: mockLocalStorage,
          configurable: true,
          writable: true
        });
        Object.defineProperty(window, "sessionStorage", {
          value: mockSessionStorage,
          configurable: true,
          writable: true
        });
      } catch {
        // Fallback: assign to window properties directly using type assertion
        interface WindowWithMock extends Window {
          localStorage: Storage;
          sessionStorage: Storage;
        }
        (window as WindowWithMock & typeof globalThis).localStorage = mockLocalStorage as unknown as Storage;
        (window as WindowWithMock & typeof globalThis).sessionStorage = mockSessionStorage as unknown as Storage;
      }
    }
  }
})();
