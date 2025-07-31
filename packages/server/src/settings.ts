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

export { SettingsInterface, User };
