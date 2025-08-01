import { getSettings } from "./settings";
import { createHash, randomBytes } from "crypto";

export interface AuthSession {
  token: string;
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory session store
const sessions = new Map<string, AuthSession>();

// Session expiry time (24 hours)
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function authenticateUser(username: string, password: string): boolean {
  const settings = getSettings();
  
  if (!settings.auth_protected || !settings.users) {
    return false;
  }

  const user = settings.users.find(u => u.username === username);
  if (!user) {
    return false;
  }

  return user.password === password;
}

export function createSession(username: string): AuthSession {
  const now = Date.now();
  const token = generateSessionToken();
  
  const session: AuthSession = {
    token,
    username,
    createdAt: now,
    userId: username,
    expiresAt: now + SESSION_EXPIRY,
  };

  sessions.set(token, session);
  return session;
}

export function validateSession(token: string): AuthSession | null {
  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  return session;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}

// Clean up expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

export function isAuthRequired(): boolean {
  const settings = getSettings();
  return settings.auth_protected;
}