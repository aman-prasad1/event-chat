import { useMutation } from '@tanstack/react-query';
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
  }; 
}