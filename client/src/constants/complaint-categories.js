/**
 * Complaint Categories Constants
 * Centralized source of truth for complaint categories
 */

export const COMPLAINT_CATEGORIES = {
  HOSTEL: "HOSTEL",
  ADMINISTRATIVE: "ADMINISTRATIVE",
  ACADEMIC: "ACADEMIC",
};

export const CATEGORY_LABELS = {
  [COMPLAINT_CATEGORIES.HOSTEL]: "Hostel",
  [COMPLAINT_CATEGORIES.ADMINISTRATIVE]: "Administrative",
  [COMPLAINT_CATEGORIES.ACADEMIC]: "Academic",
};

export const CATEGORY_COLORS = {
  [COMPLAINT_CATEGORIES.HOSTEL]: "#00c4cc",
  [COMPLAINT_CATEGORIES.ADMINISTRATIVE]: "#f1f5f9",
  [COMPLAINT_CATEGORIES.ACADEMIC]: "#ffc107",
};

/**
 * Get label for a category
 * @param {string} category - Category key from COMPLAINT_CATEGORIES
 * @returns {string} Human-readable label
 */
export const getCategoryLabel = (category) => {
  return CATEGORY_LABELS[category] || "Unknown";
};

/**
 * Get color for a category
 * @param {string} category - Category key from COMPLAINT_CATEGORIES
 * @returns {string} Hex color code
 */
export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || "#e5e7eb";
};

/**
 * Get all categories as array for dropdowns
 * @returns {Array<{value: string, label: string}>}
 */
export const getCategoryOptions = () => {
  return Object.entries(COMPLAINT_CATEGORIES).map(([, value]) => ({
    value,
    label: CATEGORY_LABELS[value],
  }));
};
