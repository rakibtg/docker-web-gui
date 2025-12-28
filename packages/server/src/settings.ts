import { join, resolve, isAbsolute } from "path";
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
  auth_protected: true,
  allowed_ip_list: null,
};

let settings: SettingsInterface;

function resolveSettingsPath(): string {
  const envPath = process.env.SETTINGS_PATH?.trim();
  if (envPath) {
    return isAbsolute(envPath) ? envPath : resolve(process.cwd(), envPath);
  }
  return join(__dirname, "../.settings.json");
}

function parseSettingsFile(settingsPath: string): SettingsInterface | null {
  if (!existsSync(settingsPath)) {
    return null;
  }

  try {
    const settingsFile = readFileSync(settingsPath, "utf8");
    const parsedSettings = JSON.parse(settingsFile);

    // Validate the structure and provide defaults
    return {
      auth_protected: parsedSettings.auth_protected || false,
      users: Array.isArray(parsedSettings.users) ? parsedSettings.users : null,
      allowed_ip_list: Array.isArray(parsedSettings.allowed_ip_list)
        ? parsedSettings.allowed_ip_list
        : null,
    };
  } catch (error) {
    console.warn(
      "Failed to parse settings file, using default configuration:",
      error
    );
    return defaultSettings;
  }
}

function loadSettings(): SettingsInterface {
  const settingsPath = resolveSettingsPath();
  const defaultSettingsPath = join(__dirname, "../.settings.json");

  console.log("Loading settings from:", settingsPath);

  const parsedSettings = parseSettingsFile(settingsPath);
  if (parsedSettings) {
    return parsedSettings;
  }

  if (settingsPath !== defaultSettingsPath) {
    console.warn(
      "Settings file not found at SETTINGS_PATH, falling back to default:",
      defaultSettingsPath
    );
    const fallbackSettings = parseSettingsFile(defaultSettingsPath);
    if (fallbackSettings) {
      return fallbackSettings;
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
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function normalizeIP(ip: string): string {
  return ip.replace(/^::ffff:/, "");
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function getTrustedProxyIPs(): string[] {
  if (!isTruthyEnv(process.env.TRUST_PROXY)) {
    return [];
  }

  const rawList = process.env.TRUST_PROXY_LIST || process.env.TRUST_PROXY_IPS;
  if (!rawList) {
    return [];
  }

  return rawList
    .split(",")
    .map((ip) => normalizeIP(ip.trim()))
    .filter((ip) => ip !== "" && isValidIP(ip));
}

function getForwardedClientIP(headerValue: string | undefined): string | null {
  if (!headerValue) {
    return null;
  }

  const candidates = headerValue
    .split(",")
    .map((entry) => normalizeIP(entry.trim()))
    .filter((entry) => entry !== "");

  for (const candidate of candidates) {
    if (isValidIP(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function isIPAllowed(clientIP: string): boolean {
  const allowedIPs = getSettings("allowed_ip_list");

  // If allowed_ip_list is null, empty, or contains only empty strings, allow all IPs
  if (!allowedIPs || allowedIPs.length === 0) {
    return true;
  }

  // Filter out empty strings and validate IPs
  const validAllowedIPs = allowedIPs.filter(
    (ip) => ip.trim() !== "" && isValidIP(ip.trim())
  );

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
  // Fall back to connection remote address
  const remoteAddress =
    req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (remoteAddress) {
    const normalizedRemote = normalizeIP(remoteAddress);
    const trustedProxies = getTrustedProxyIPs();
    const isTrustedProxy = trustedProxies.includes(normalizedRemote);

    if (isTrustedProxy) {
      const forwardedClient = getForwardedClientIP(
        req.headers["x-forwarded-for"]
      );
      if (forwardedClient) {
        return forwardedClient;
      }

      const realIP = getForwardedClientIP(req.headers["x-real-ip"]);
      if (realIP) {
        return realIP;
      }
    }

    return normalizedRemote;
  }

  return "unknown";
}

export function isTrustedProxyRequest(req: any): boolean {
  const remoteAddress =
    req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (!remoteAddress) {
    return false;
  }

  const normalizedRemote = normalizeIP(remoteAddress);
  const trustedProxies = getTrustedProxyIPs();
  return trustedProxies.includes(normalizedRemote);
}

export { SettingsInterface, User };
