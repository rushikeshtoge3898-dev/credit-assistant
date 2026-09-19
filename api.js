import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "https://credit-assistant-backend.onrender.com";
const API_BASE_URL = rawBaseURL.replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we're attempting to login
      const isLoginRequest =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/api/auth/login") ||
        error.config?.url?.includes("/auth/firebase-login");
      if (!isLoginRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Modular API Client Methods aligned to standardized /api/* routes
export const authAPI = {
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    const response = await api.post("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  },
  register: async (name, email, password, phone_number = null) => {
    const payload = { name, email, password };
    if (phone_number) payload.phone_number = phone_number;
    const response = await api.post("/api/auth/register", payload);
    return response.data;
  },
  firebaseLogin: async (data) => {
    const response = await api.post("/api/auth/firebase-login", data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },
  updateProfile: async (userData) => {
    const response = await api.put("/api/auth/profile", userData);
    return response.data;
  },
};

export const creditAPI = {
  getProfile: async () => {
    const response = await api.get("/api/credit/profile");
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put("/api/credit/profile", data);
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get("/api/credit/analytics");
    return response.data;
  },
  getScoreHistory: async () => {
    const response = await api.get("/api/credit/score-history");
    return response.data;
  },
  addScoreHistory: async (data) => {
    const response = await api.post("/api/credit/score-history", data);
    return response.data;
  },
};

export const accountsAPI = {
  getAccounts: async () => {
    const response = await api.get("/api/accounts");
    return response.data;
  },
  createAccount: async (data) => {
    const response = await api.post("/api/accounts", data);
    return response.data;
  },
  updateAccount: async (id, data) => {
    const response = await api.put(`/api/accounts/${id}`, data);
    return response.data;
  },
  deleteAccount: async (id) => {
    const response = await api.delete(`/api/accounts/${id}`);
    return response.data;
  },
};

export const paymentsAPI = {
  getPayments: async () => {
    const response = await api.get("/api/payments");
    return response.data;
  },
  createPayment: async (data) => {
    const response = await api.post("/api/payments", data);
    return response.data;
  },
};

export const goalsAPI = {
  getGoals: async () => {
    const response = await api.get("/api/goals");
    return response.data;
  },
  createGoal: async (data) => {
    const response = await api.post("/api/goals", data);
    return response.data;
  },
  updateGoal: async (id, data) => {
    const response = await api.put(`/api/goals/${id}`, data);
    return response.data;
  },
  deleteGoal: async (id) => {
    const response = await api.delete(`/api/goals/${id}`);
    return response.data;
  },
};

export const recommendationsAPI = {
  getRecommendations: async () => {
    const response = await api.get("/api/recommendations");
    return response.data;
  },
  createRecommendation: async (data) => {
    const response = await api.post("/api/recommendations", data);
    return response.data;
  },
  updateRecommendation: async (id, data) => {
    const response = await api.put(`/api/recommendations/${id}`, data);
    return response.data;
  },
};

export const aiAPI = {
  chat: async (message, history = [], language = "en") => {
    const selectedLang = language || localStorage.getItem("credit_assistant_lang") || "en";
    const response = await api.post("/api/ai/chat", {
      message,
      history,
      language: selectedLang,
    });
    return response.data;
  },
  analyzeCredit: async () => {
    const response = await api.post("/api/ai/analyze-credit");
    return response.data;
  },
};

export default api;
