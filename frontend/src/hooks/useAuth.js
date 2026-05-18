import { useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import { userStore } from '../store/userStore';

const register = async (userData) => {
  const { setUser, setIsLoading } = userStore.getState();

  setIsLoading(true);
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    setUser(response.data);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
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
    setUser(response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
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

  return {
    register: registerMutation,
    login: loginMutation,
  }; 
}

// export const useRegister = (userData) => {
//   const registerMutation = useMutation({
//     mutationKey: ['register'], 
//     mutationFn: () => register(userData),
//     enabled: false,
//   });

//   return {
//     register: registerMutation,
//   };
// };

// export const useLogin = (credentials) => {
//   const loginMutation = useMutation({
//     mutationKey: ['login'],
//     mutationFn: () => login(credentials),
//     enabled: false,
//   });

//   return {
//     login: loginMutation,
//   };
// };