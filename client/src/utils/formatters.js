/**
 * Formatter Utilities
 * Centralized utilities for formatting dates, text, numbers, etc.
 */

export const parseApiDate = (date) => {
  if (!date) return null;

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const hasTimezone =
    typeof date === "string" && /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(date);
  const normalizedDate =
    typeof date === "string" && !hasTimezone ? `${date}Z` : date;

  const parsed = new Date(normalizedDate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(date);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Format date to readable string
 * @param {Date|string} date - The date to format
 * @param {string} format - 'short', 'long', or 'iso'
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = "short") => {
  if (!date) return "N/A";

  try {
    const d = parseApiDate(date);
    if (!d) return "Invalid Date";

    if (format === "short") {
      return d.toLocaleDateString("en-IN");
    }
    if (format === "long") {
      return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (format === "iso") {
      return d.toISOString().split("T")[0];
    }
    return d.toLocaleDateString("en-IN");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

/**
 * Format time to readable string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted time (HH:MM:SS)
 */
export const formatTime = (date) => {
  if (!date) return "N/A";

  try {
    const parsed = parseApiDate(date);
    if (!parsed) return "Invalid Time";

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    console.error("Time formatting error:", error);
    return "Invalid Time";
  }
};

/**
 * Format date and time together
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  return `${formatDate(date, "short")} ${formatTime(date)}`;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} Truncated text with ellipsis
 */
export const truncateText = (text, length = 50) => {
  if (!text) return "";
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Calculate resolution rate percentage
 * @param {Array} complaints - Array of complaint objects
 * @returns {number} Resolution rate as percentage
 */
export const calculateResolutionRate = (complaints = []) => {
  if (complaints.length === 0) return 0;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
  return parseFloat(((resolved / complaints.length) * 100).toFixed(1));
};

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (typeof num !== "number") return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatEnumLabel = (value) => {
  if (!value) return "";

  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Get time ago string (e.g., "2 hours ago")
 * @param {Date|string} date - The date to compare
 * @returns {string} Time ago string
 */
export const getTimeAgo = (date) => {
  if (!date) return "N/A";

  try {
    const d = parseApiDate(date);
    if (!d) return "N/A";

    const now = new Date();
    const seconds = Math.floor((now - d) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  } catch (error) {
    console.error("Time ago formatting error:", error);
    return "N/A";
  }
};
