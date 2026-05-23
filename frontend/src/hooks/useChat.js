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

const getMessages = async (conversationId) => {
  const { setMessages, setMessagesLoading } = chatStore.getState();

  setMessagesLoading(true);
  try {
    const response = await axiosInstance.get(`/messages/conversation-messages/${conversationId}`);
    const messages = response.data.data.messages;
    // API returns messages in desc order, reverse for chronological display
    setMessages(messages.reverse());
    return messages;
  } catch (error) {
    console.error('Failed to fetch messages:', error.response?.data || error.message);
    throw error;
  } finally {
    setMessagesLoading(false);
  }
};

const sendMessage = async (conversationId, text) => {
  const { addMessage } = chatStore.getState();

  try {
    const response = await axiosInstance.post('/messages', {
      conversationId,
      content: JSON.stringify({ text }),
      type: 'text',
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to send message:', error.response?.data || error.message);
    throw error;
  }
};

export const useChat = () => {
  return {
    getRecentConversations,
    getMessages,
    sendMessage,
  };
};
