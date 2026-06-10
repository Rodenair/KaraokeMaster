/**
 * In-memory session store. All data is lost on server restart — this is intentional.
 * No database, no persistence, no authentication.
 */
import { Session } from "./types";

// Global singleton map so the same reference is reused across hot-reloads in dev.
const globalForStore = globalThis as unknown as { sessionStore?: Map<string, Session> };

export const sessions: Map<string, Session> =
  globalForStore.sessionStore ?? (globalForStore.sessionStore = new Map());

// Simple per-IP rate limiter for queue submissions: max 10 submissions per minute.
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}
