import api from './api';

export const fetchNotifications = async () => {
    const response = await api.get('/notifications/');
    return response.data;
};

export const markNotificationRead = async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
};
