import api from './api';

export const fetchDepartments = async () => {
    const response = await api.get('/departments/');
    return response.data;
};
