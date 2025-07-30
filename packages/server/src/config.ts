import { join } from "path";
import { readFileSync, existsSync } from "fs";

interface User {
  username: string;
  password: string;
}

interface EnvConfig {
  users: User[] | null;
  auth_protected: boolean;
  allowed_ip_list: string[] | null;
}

const defaultConfig: EnvConfig = {
  users: null,
  auth_protected: false,
  allowed_ip_list: null,
};

let config: EnvConfig;

function loadConfig(): EnvConfig {
  const configPath = join(__dirname, "../env.json");

  if (existsSync(configPath)) {
    try {
      const configFile = readFileSync(configPath, "utf8");
      const parsedConfig = JSON.parse(configFile);

      // Validate the structure and provide defaults
      return {
        auth_protected: parsedConfig.auth_protected || false,
        users: Array.isArray(parsedConfig.users) ? parsedConfig.users : null,
        allowed_ip_list: Array.isArray(parsedConfig.allowed_ip_list)
          ? parsedConfig.allowed_ip_list
          : null,
      };
    } catch (error) {
      console.warn(
        "Failed to parse env.json, using default configuration:",
        error
      );
      return defaultConfig;
    }
  }

  return defaultConfig;
}

// Load configuration once when the module is imported
config = loadConfig();

// Function overloads for type safety
export function getConfig(): EnvConfig;
export function getConfig<K extends keyof EnvConfig>(key: K): EnvConfig[K];
export function getConfig<K extends keyof EnvConfig>(
  key?: K
): EnvConfig | EnvConfig[K] {
  if (key !== undefined) {
    return config[key];
  }
  return config;
}

export function reloadConfig(): EnvConfig {
  config = loadConfig();
  return config;
}

export { EnvConfig, User };
