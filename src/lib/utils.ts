import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safe version of JSON.stringify that handles circular structures gracefully.
 */
export function safeStringify(obj: any, space?: string | number): string {
  try {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) {
          return "[Circular]";
        }
        cache.add(value);
      }
      return value;
    }, space);
  } catch {
    return "[Serialization Failed]";
  }
}

/**
 * Compresses a base64 image to be under a certain size (default 1MB)
 * by reducing resolution and quality.
 */
export async function compressImageBase64(base64: string, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Scale down if exceeds max dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context failed"));
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Attempt first compression
      let compressed = canvas.toDataURL("image/jpeg", quality);
      
      // If still too large (approx 1MB limit for base64 is ~1.3M chars)
      // Firestore limit is 1,048,576 bytes. Base64 is ~4/3 size of data.
      // So we target around 800,000 characters to be safe.
      if (compressed.length > 800000) {
        compressed = canvas.toDataURL("image/jpeg", quality * 0.6);
      }
      
      resolve(compressed);
    };
    img.onerror = () => reject(new Error("Failed to load or compress image. This could be due to invalid/corrupted base64 data or cross-origin restrictions."));
  });
}
