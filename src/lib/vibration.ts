/**
 * nxclip.ai Haptic Vibrations Utility
 * Provides lightweight haptic feedback on supporting devices (primarily Android/mobile PWA).
 */

export const HAPTIC_PATTERNS = {
  light: 15, // Single lightweight tick
  medium: 35, // Medium bump
  heavy: 60, // Solid buzz for major initiating actions
  success: [40, 50, 40], // Double tap haptic for successful async response
  warning: [50, 100, 50], // Double bump for alerts
  error: [60, 40, 60, 40, 80], // Aggressive pattern for fail states
};

export function triggerHaptic(pattern: keyof typeof HAPTIC_PATTERNS | number | number[]): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (typeof pattern === 'string') {
        navigator.vibrate(HAPTIC_PATTERNS[pattern]);
      } else {
        navigator.vibrate(pattern);
      }
    } catch (err) {
      console.warn('[Haptic System] Failed to trigger navigator.vibrate:', err);
    }
  }
}
