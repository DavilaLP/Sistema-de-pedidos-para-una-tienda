import api from './api';

export const getOrders      = ()        => api.get('/api/orders');
export const getOrder       = (id)      => api.get(`/api/orders/${id}`);
export const createOrder    = (data)    => api.post('/api/orders', data);
export const updateStatus   = (id,s)    => api.put(`/api/orders/${id}/status?status=${s}`);
export const cancelOrder    = (id)      => api.post(`/api/orders/${id}/cancel`);
