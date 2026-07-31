import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { ZodError } from "zod";

export function formatError(error: any): string {
  if (error instanceof ZodError) {
    return error.issues.map(e => e.message).join(", ");
  }
  if (typeof error === "string" && error.startsWith("[") && error.endsWith("]")) {
    try {
      const parsed = JSON.parse(error);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
        return parsed.map((e: any) => e.message).join(", ");
      }
    } catch {
      // Ignore
    }
  }
  if (error && typeof error === "object" && error.message) {
    if (typeof error.message === "string" && error.message.startsWith("[") && error.message.endsWith("]")) {
      try {
        const parsed = JSON.parse(error.message);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
          return parsed.map((e: any) => e.message).join(", ");
        }
      } catch {
        // Ignore
      }
    }
    return error.message;
  }
  return String(error);
}

export function sanitizeForClient<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (
    Buffer.isBuffer(obj) ||
    obj instanceof Uint8Array ||
    (typeof obj === "object" && obj?.constructor?.name === "Uint8Array")
  ) {
    return Buffer.from(obj as any).toString("base64") as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForClient(item)) as unknown as T;
  }

  if (typeof obj === "object" && !(obj instanceof Date)) {
    const sanitized: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (
        Buffer.isBuffer(val) ||
        val instanceof Uint8Array ||
        (typeof val === "object" && val?.constructor?.name === "Uint8Array")
      ) {
        sanitized[key] = Buffer.from(val).toString("base64");
      } else {
        sanitized[key] = sanitizeForClient(val);
      }
    }
    return sanitized as T;
  }

  return obj;
}


