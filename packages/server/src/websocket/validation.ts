// Helper function to validate container ID before passing to Docker operations
// This provides defense in depth against command injection
export function validateContainerIdInput(containerId: unknown): string {
  if (!containerId || typeof containerId !== "string") {
    throw new Error("Container ID must be a non-empty string");
  }

  const normalized = containerId.trim();

  // Check for reasonable length
  if (normalized.length < 1 || normalized.length > 64) {
    throw new Error("Invalid container ID length");
  }

  // Check for control characters or null bytes (prevents injection)
  if (/[\x00-\x1F\x7F]/.test(normalized)) {
    throw new Error("Container ID contains invalid control characters");
  }

  // Check for shell metacharacters (prevents command injection)
  // Allow: letters, numbers, underscores, hyphens, dots
  // Block: semicolons, pipes, ampersands, dollar signs, backticks, spaces, quotes
  if (/[;&|$`\\(){}<>\s"']/.test(normalized)) {
    throw new Error("Container ID contains dangerous characters");
  }

  // Must be either a valid hex ID or a valid container name
  const isValidHexId = /^[a-f0-9]{12,64}$/i.test(normalized);
  const isValidName = /^[A-Za-z0-9_.-]+$/.test(normalized);

  if (!isValidHexId && !isValidName) {
    throw new Error("Invalid container ID or name format");
  }

  return normalized;
}
