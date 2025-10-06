// src/api.js
import axios from "axios";
import auth from "./auth";

const api = axios.create({
  baseURL: import.meta.env.DEV 
    ? "http://localhost:3000/api" 
    : "https://trentoeventi.onrender.com/api",
});

api.interceptors.request.use(
  (config) => {
    const token = auth.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Modalità sviluppo: aggiungi header per bypassare autenticazione
    if (import.meta.env.DEV) {
      config.headers['x-dev-bypass'] = 'true';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
