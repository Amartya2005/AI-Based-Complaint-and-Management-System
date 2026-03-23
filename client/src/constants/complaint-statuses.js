/**
 * Complaint Status Constants
 * Centralized source of truth for complaint statuses
 */

export const COMPLAINT_STATUSES = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
};

export const STATUS_LABELS = {
  [COMPLAINT_STATUSES.PENDING]: 'Pending',
  [COMPLAINT_STATUSES.ASSIGNED]: 'Assigned',
  [COMPLAINT_STATUSES.IN_PROGRESS]: 'In Progress',
  [COMPLAINT_STATUSES.RESOLVED]: 'Resolved',
  [COMPLAINT_STATUSES.REJECTED]: 'Rejected',
};

export const STATUS_COLORS = {
  [COMPLAINT_STATUSES.PENDING]: '#ffc107',
  [COMPLAINT_STATUSES.ASSIGNED]: '#2196f3',
  [COMPLAINT_STATUSES.IN_PROGRESS]: '#ff9800',
  [COMPLAINT_STATUSES.RESOLVED]: '#4caf50',
  [COMPLAINT_STATUSES.REJECTED]: '#f44336',
};

// Status workflow - which statuses can transition to which
export const STATUS_TRANSITIONS = {
  [COMPLAINT_STATUSES.PENDING]: [
    COMPLAINT_STATUSES.ASSIGNED,
    COMPLAINT_STATUSES.REJECTED,
  ],
  [COMPLAINT_STATUSES.ASSIGNED]: [
    COMPLAINT_STATUSES.IN_PROGRESS,
    COMPLAINT_STATUSES.REJECTED,
  ],
  [COMPLAINT_STATUSES.IN_PROGRESS]: [
    COMPLAINT_STATUSES.RESOLVED,
    COMPLAINT_STATUSES.REJECTED,
  ],
  [COMPLAINT_STATUSES.RESOLVED]: [],
  [COMPLAINT_STATUSES.REJECTED]: [],
};

/**
 * Get label for a status
 * @param {string} status - Status key from COMPLAINT_STATUSES
 * @returns {string} Human-readable label
 */
export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || 'Unknown';
};

/**
 * Get color for a status
 * @param {string} status - Status key from COMPLAINT_STATUSES
 * @returns {string} Hex color code
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#e5e7eb';
};

/**
 * Check if a status transition is valid
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Desired status
 * @returns {boolean}
 */
export const isValidStatusTransition = (fromStatus, toStatus) => {
  const allowedTransitions = STATUS_TRANSITIONS[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
};

/**
 * Get allowed next statuses for a given status
 * @param {string} status - Current status
 * @returns {Array<string>}
 */
export const getAllowedNextStatuses = (status) => {
  return STATUS_TRANSITIONS[status] || [];
};
