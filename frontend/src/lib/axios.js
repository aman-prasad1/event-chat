import axios from "axios";
import { userStore } from "../store/userStore";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── 401 Interceptor: auto-refresh & retry ───
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip auth endpoints to prevent infinite loops
    const skipPaths = ["/auth/login", "/auth/register", "/auth/refresh-tokens"];
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      skipPaths.some((path) => originalRequest.url?.includes(path))
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => axiosInstance(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axiosInstance.post("/auth/refresh-tokens");
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      userStore.getState().clearUser();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);