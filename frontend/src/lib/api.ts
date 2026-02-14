import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  verifyEmail: (data: { email: string; otp: string }) => api.post('/auth/verify-email', data),
  resendOTP: (email: string) => api.post('/auth/resend-otp', { email }),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  switchMode: (mode: 'buyer' | 'seller') => api.put('/auth/switch-mode', { mode }),
};

// Listings
export const listingAPI = {
  getAll: (params?: any) => api.get('/listings', { params }),
  search: (q: string, params?: any) => api.get('/listings/search', { params: { q, ...params } }),
  getById: (id: string) => api.get(`/listings/${id}`),
  create: (formData: FormData) => api.post('/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: any) => api.put(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
  getMine: () => api.get('/listings/user/my-listings'),
};

// Orders
export const orderAPI = {
  create: (listingId: string) => api.post('/orders', { listingId }),
  verifyPayment: (data: { orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/orders/verify-payment', data),
  confirmDelivery: (orderId: string) => api.post(`/orders/${orderId}/confirm-delivery`),
  dispute: (orderId: string, reason: string) => api.post(`/orders/${orderId}/dispute`, { reason }),
  getMine: (role?: string) => api.get('/orders/my-orders', { params: { role } }),
  getDownload: (orderId: string) => api.get(`/orders/${orderId}/download`),
};

// Payments
export const paymentAPI = {
  onboard: () => api.post('/payments/onboard'),
  checkStatus: () => api.get('/payments/onboarding-status'),
  getBalance: () => api.get('/payments/balance'),
};

// AI
export const aiAPI = {
  ocrExtract: (formData: FormData) => api.post('/ai/ocr-extract', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  chatWithNotes: (listingId: string, question: string, chatHistory: any[]) => api.post(`/ai/chat/${listingId}`, { question, chatHistory }),
  getStudyKit: (listingId: string) => api.get(`/ai/study-kit/${listingId}`),
};

// Chat
export const chatAPI = {
  getOrCreate: (listingId: string, sellerId: string) => api.post('/chats', { listingId, sellerId }),
  getAll: () => api.get('/chats'),
  getMessages: (chatId: string) => api.get(`/chats/${chatId}`),
  sendMessage: (chatId: string, text: string) => api.post(`/chats/${chatId}/message`, { text }),
};

// Reviews
export const reviewAPI = {
  create: (data: { orderId: string; rating: number; comment: string }) => api.post('/reviews', data),
  getSellerReviews: (sellerId: string) => api.get(`/reviews/seller/${sellerId}`),
};

// Universities
export const universityAPI = {
  getAll: () => api.get('/universities'),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: () => api.put('/notifications/read'),
};

export default api;
