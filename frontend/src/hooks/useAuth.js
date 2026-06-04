import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import { userStore } from '../store/userStore';
import { chatStore } from '../store/chatStore';

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
  const { clearChat } = chatStore.getState();

  setIsLoading(true);
  try {
    const response = await axiosInstance.post('/auth/logout');
    clearUser();
    clearChat();
    return response.data;
  } catch (error) {
    console.error('Logout failed:', error.response?.data || error.message);
    clearUser();
    clearChat();
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

const updateProfile = async (formData) => {
  const { setUser } = userStore.getState();

  try {
    const response = await axiosInstance.patch('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const updatedUser = response.data.data.user;
    setUser(updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Profile update failed:', error.response?.data || error.message);
    throw error;
  }
};

const changePassword = async ({ currentPassword, newPassword, confirmNewPassword }) => {
  try {
    const response = await axiosInstance.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Password change failed:', error.response?.data || error.message);
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
    updateProfile,
    changePassword,
  };
}