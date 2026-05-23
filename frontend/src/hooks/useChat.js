import { axiosInstance } from '../lib/axios';
import { chatStore } from '../store/chatStore';

const getRecentConversations = async () => {
  const { setConversations, setIsLoading } = chatStore.getState();

  setIsLoading(true);
  try {
    const response = await axiosInstance.get('/messages/recent-conversations');
    const conversations = response.data.data.conversations;
    setConversations(conversations);
    return conversations;
  } catch (error) {
    console.error('Failed to fetch conversations:', error.response?.data || error.message);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

export const useChat = () => {
  return {
    getRecentConversations,
  };
};
