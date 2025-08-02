import { join } from "path";
import { readFileSync, existsSync } from "fs";

interface User {
  username: string;
  password: string;
}

interface SettingsInterface {
  users: User[] | null;
  auth_protected: boolean;
  allowed_ip_list: string[] | null;
}

const defaultSettings: SettingsInterface = {
  users: null,
  auth_protected: false,
  allowed_ip_list: null,
};

let settings: SettingsInterface;

function loadSettings(): SettingsInterface {
  const settingsPath = join(__dirname, "../.settings.json");

  if (existsSync(settingsPath)) {
    try {
      const settingsFile = readFileSync(settingsPath, "utf8");
      const parsedSettings = JSON.parse(settingsFile);

      // Validate the structure and provide defaults
      return {
        auth_protected: parsedSettings.auth_protected || false,
        users: Array.isArray(parsedSettings.users)
          ? parsedSettings.users
          : null,
        allowed_ip_list: Array.isArray(parsedSettings.allowed_ip_list)
          ? parsedSettings.allowed_ip_list
          : null,
      };
    } catch (error) {
      console.warn(
        "Failed to parse env.json, using default settingsuration:",
        error
      );
      return defaultSettings;
    }
  }

  return defaultSettings;
}

settings = loadSettings();

// Function overloads for type safety
export function getSettings(): SettingsInterface;
export function getSettings<K extends keyof SettingsInterface>(
  key: K
): SettingsInterface[K];
export function getSettings<K extends keyof SettingsInterface>(
  key?: K
): SettingsInterface | SettingsInterface[K] {
  if (key !== undefined) {
    return settings[key];
  }
  return settings;
}

export function reloadSettings(): SettingsInterface {
  settings = loadSettings();
  return settings;
}

// IP validation utilities
function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export function isIPAllowed(clientIP: string): boolean {
  const allowedIPs = getSettings('allowed_ip_list');
  
  // If allowed_ip_list is null, empty, or contains only empty strings, allow all IPs
  if (!allowedIPs || allowedIPs.length === 0) {
    return true;
  }
  
  // Filter out empty strings and validate IPs
  const validAllowedIPs = allowedIPs.filter(ip => ip.trim() !== '' && isValidIP(ip.trim()));
  
  // If no valid IPs in the list, allow all
  if (validAllowedIPs.length === 0) {
    return true;
  }
  
  // Check if client IP is in the allowed list
  const normalizedClientIP = clientIP.trim();
  return validAllowedIPs.includes(normalizedClientIP);
}

// Helper function to extract real IP from request
export function extractClientIP(req: any): string {
  // Check for forwarded headers (proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  // Check for real IP header
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP.trim();
  }
  
  // Fall back to connection remote address
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (remoteAddress) {
    // Remove IPv6 prefix if present (::ffff:192.168.1.1 -> 192.168.1.1)
    return remoteAddress.replace(/^::ffff:/, '');
  }
  
  return 'unknown';
}

export { SettingsInterface, User };
