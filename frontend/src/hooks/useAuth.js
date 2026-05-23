import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import { userStore } from '../store/userStore';

const register = async (userData) => {
  const { setUser, setIsLoading } = userStore.getState();

  setIsLoading(true);
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

const login = async (credentials) => {
  const { setUser, setIsLoading } = userStore.getState();

  setIsLoading(true);
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    setUser(response.data.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

const logout = async () => {
  const { clearUser, setIsLoading } = userStore.getState();

  setIsLoading(true);
  try {
    const response = await axiosInstance.post('/auth/logout');
    clearUser();
    return response.data;
  } catch (error) {
    console.error('Logout failed:', error.response?.data || error.message);
    clearUser();
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Fetches user profile; 401 handling is done by the axios interceptor
const getUser = async () => {
  const { setUser, clearUser } = userStore.getState();

  try {
    const response = await axiosInstance.get('/users/profile');
    setUser(response.data.data.user);
    return response.data.data.user;
  } catch (error) {
    clearUser();
    throw error;
  }
};


export const useAuth = () => {
  const registerMutation = useMutation({
    mutationKey: ['register'],
    mutationFn: register,
    enabled: false,
  });

  const loginMutation = useMutation({
    mutationKey: ['login'],
    mutationFn: login,
    enabled: false,
  });

  const logoutMutation = useMutation({
    mutationKey: ['logout'],
    mutationFn: logout,
    enabled: false,
  });

  return {
    register: registerMutation,
    login: loginMutation,
    logout: logoutMutation,
    getUser,
  };
}