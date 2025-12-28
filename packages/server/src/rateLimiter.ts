/**
 * Rate Limiter for protecting endpoints from brute-force attacks
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts allowed in the window
  blockDurationMs: number; // How long to block after exceeding limit
  maxTrackedIPs?: number; // Optional: Maximum IPs to track (prevents memory exhaustion)
}

export class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request should be allowed
   * @param identifier Unique identifier (typically IP address)
   * @returns Object with allowed status and retry information
   */
  public checkLimit(identifier: string): {
    allowed: boolean;
    retryAfter?: number;
    remaining?: number;
  } {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    // If no entry exists, allow and create new entry
    if (!entry) {
      // Optional: Check if we've hit the max tracked IPs limit
      if (
        this.config.maxTrackedIPs &&
        this.attempts.size >= this.config.maxTrackedIPs
      ) {
        // Force cleanup to make room
        this.cleanup();

        // If still at limit after cleanup, remove oldest entry
        if (this.attempts.size >= this.config.maxTrackedIPs) {
          const oldestIP = this.findOldestEntry();
          if (oldestIP) {
            this.attempts.delete(oldestIP);
          }
        }
      }

      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
      };
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        retryAfter,
      };
    }

    // Check if the time window has expired
    const windowExpired = now - entry.firstAttempt > this.config.windowMs;
    if (windowExpired) {
      // Reset the window
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
      };
    }

    // Increment attempt count
    entry.count++;
    entry.lastAttempt = now;

    // Check if limit exceeded
    if (entry.count > this.config.maxAttempts) {
      entry.blockedUntil = now + this.config.blockDurationMs;
      const retryAfter = Math.ceil(this.config.blockDurationMs / 1000);
      return {
        allowed: false,
        retryAfter,
      };
    }

    // Still within limit
    return {
      allowed: true,
      remaining: this.config.maxAttempts - entry.count,
    };
  }

  /**
   * Record a successful authentication (reset the counter)
   * @param identifier Unique identifier (typically IP address)
   */
  public recordSuccess(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Manually reset rate limit for an identifier
   * @param identifier Unique identifier to reset
   */
  public reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredIdentifiers: string[] = [];

    for (const [identifier, entry] of this.attempts.entries()) {
      // Remove if:
      // 1. Block has expired and enough time has passed
      // 2. No activity for longer than window + block duration
      const inactiveTime = now - entry.lastAttempt;
      const maxInactiveTime =
        this.config.windowMs + this.config.blockDurationMs;

      if (inactiveTime > maxInactiveTime) {
        expiredIdentifiers.push(identifier);
      }
    }

    for (const identifier of expiredIdentifiers) {
      this.attempts.delete(identifier);
    }

    if (expiredIdentifiers.length > 0) {
      console.log(
        `Rate limiter: Cleaned up ${expiredIdentifiers.length} expired entries`
      );
    }
  }

  /**
   * Find the oldest entry (by last attempt) for eviction
   */
  private findOldestEntry(): string | null {
    let oldestIP: string | null = null;
    let oldestTime = Infinity;

    for (const [identifier, entry] of this.attempts.entries()) {
      if (entry.lastAttempt < oldestTime) {
        oldestTime = entry.lastAttempt;
        oldestIP = identifier;
      }
    }

    return oldestIP;
  }

  /**
   * Get current statistics for monitoring
   */
  public getStats(): {
    totalTracked: number;
    totalBlocked: number;
  } {
    const now = Date.now();
    let blocked = 0;

    for (const entry of this.attempts.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blocked++;
      }
    }

    return {
      totalTracked: this.attempts.size,
      totalBlocked: blocked,
    };
  }

  /**
   * Cleanup interval on shutdown
   */
  public destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * Get rate limiter configuration from settings file with fallback defaults
 */
function getRateLimiterConfig(): RateLimitConfig {
  // Import at runtime to avoid circular dependency
  const { getSettings } = require("./settings");
  const settings = getSettings();
  const rateLimit = settings.rate_limit || {};

  const windowMinutes = rateLimit.window_minutes ?? 15;
  const maxAttempts = rateLimit.max_attempts ?? 5;
  const blockMinutes = rateLimit.block_minutes ?? 15;
  const maxTrackedIPs = rateLimit.max_tracked_ips ?? 10000;

  return {
    windowMs: windowMinutes * 60 * 1000,
    maxAttempts: Math.max(1, maxAttempts), // At least 1 attempt
    blockDurationMs: blockMinutes * 60 * 1000,
    maxTrackedIPs: Math.max(100, maxTrackedIPs), // At least 100 IPs
  };
}

// Pre-configured rate limiters for different use cases
export const authRateLimiter = new RateLimiter(getRateLimiterConfig());

export const strictAuthRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 3, // 3 attempts per 15 minutes
  blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes
});
