import { toast } from "sonner";

/**
 * Custom error payload interface
 */
export interface AppErrorPayload {
  message: string;
  code?: string;
  subsystem?: string;
  context?: string;
  timestamp: string;
}

/**
 * A helper function to dispatch error toast notifications using Sonner.
 * Consistently used whenever an API call in Redux slices fails.
 */
export function dispatchErrorToast(
  error: unknown,
  subsystem: string = "System",
  context: string = ""
): AppErrorPayload {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code || "API_ERROR";
  const timestamp = new Date().toISOString();

  const errPayload: AppErrorPayload = {
    message,
    code,
    subsystem,
    context,
    timestamp,
  };

  // Log to console for tracing
  console.error(`[${subsystem}] Error inside context "${context}":`, error);

  // Trigger Sonner toast with elegant nxclip branding
  toast.error(`[${subsystem}] Integration Error`, {
    description: message,
    action: {
      label: "Retry",
      onClick: () => window.location.reload(),
    },
    duration: 5000,
  });

  return errPayload;
}

/**
 * Exponential Backoff Retry mechanism to gracefully handle intermittent network failures.
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  backoffFactor: number = 2,
  onRetry?: (error: any, attemptRemaining: number) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    if (onRetry) {
      onRetry(error, retries);
    }
    // Calculate backoff delay
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retries - 1, delay * backoffFactor, backoffFactor, onRetry);
  }
}
