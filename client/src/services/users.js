import api from './api';

export const fetchUsers = async (role = null) => {
    const params = role ? { role: role.toUpperCase() } : {};
    const response = await api.get('/users/', { params });
    return response.data;
};

export const createUser = async (userData) => {
    const response = await api.post('/users/', {
        ...userData,
        role: userData.role.toUpperCase(),
    });
    return response.data;
};
