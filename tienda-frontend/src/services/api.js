
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Agregar JWT a solicitudes protegidas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Manejar errores HTTP
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.response
        ? 'Ocurrió un error en la solicitud'
        : 'No se pudo conectar con el servidor');

    if (status === 401) {
      const isLoginRequest =
        error.config?.url?.includes('/auth/login');

      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');

        window.location.href = '/login';
      }
    }

    if (status === 403) {
      // Mantener la sesión y mostrar el error
      // en el componente que realizó la solicitud.
    }

    return Promise.reject({ status, message });
  }
);

export default api;
