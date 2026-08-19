import axios from 'axios';
import localApi from './localApi';

// Bản demo (Vercel): dùng localStorage thay backend khi build với VITE_USE_LOCAL=1
const USE_LOCAL = import.meta.env.VITE_USE_LOCAL === '1';

const api = axios.create({ baseURL: '/api' });

// Gắn token vào mọi request nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự đăng xuất khi token hết hạn
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default USE_LOCAL ? localApi : api;
