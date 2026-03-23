import api from './api';

/**
 * Submit a rating for a staff member on a resolved complaint
 */
export const submitRating = async (complaintId, staffId, rating, feedback = '') => {
    const response = await api.post('/ratings/rate-staff', {
        complaint_id: complaintId,
        staff_id: staffId,
        rating, // 1-5
        feedback,
    });
    return response.data;
};

/**
 * Get average rating for a staff member
 */
export const getStaffAverageRating = async (staffId) => {
    const response = await api.get(`/ratings/staff/${staffId}/average-rating`);
    return response.data;
};

/**
 * Get all staff ratings (Admin only)
 */
export const getAllStaffRatings = async (skip = 0, limit = 50) => {
    const response = await api.get('/ratings/admin/staff-ratings', {
        params: {
            skip,
            limit,
        },
    });
    return response.data;
};

/**
 * Get detailed rating statistics for a staff member
 */
export const getStaffRatingStats = async (staffId) => {
    const response = await api.get(`/ratings/staff/${staffId}/rating-stats`);
    return response.data;
};
