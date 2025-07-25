/**
 * Formats a date string into a human-readable format
 * @param dateString - The date string to format
 * @param compact - Whether to use a compact format (short month names)
 * @returns Formatted date string or "Unknown" if invalid
 */
export const formatDate = (
  dateString: string,
  compact: boolean = false
): string => {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: compact ? "short" : "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: compact ? undefined : "2-digit",
      hour12: false,
    };

    return date.toLocaleDateString("en-US", options);
  } catch {
    return dateString;
  }
};
