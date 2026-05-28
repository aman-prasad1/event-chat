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

const getMessages = async (conversationId, cursor = null, limit = 20) => {
  const { setMessagesLoading } = chatStore.getState();

  setMessagesLoading(true);
  try {
    const response = await axiosInstance.get(`/messages/conversation-messages/${conversationId}`, {
      params: {
        limit,
        ...(cursor ? { cursor } : {}),
      },
    });

    return response.data.data;
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

const sendFileMessage = async (conversationId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    formData.append('type', 'file');
    formData.append('content', JSON.stringify({ filename: file.name }));

    const response = await axiosInstance.post('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to send file:', error.response?.data || error.message);
    throw error;
  }
};

const getFileUrl = async (conversationId, messageId) => {
  try {
    const response = await axiosInstance.get(`/messages/file-url`, 
      {
        params: { conversationId, messageId }
      }
    );
    return response.data.data.fileUrl;
  } catch (error) {
    console.error('Failed to fetch file URL:', error.response?.data || error.message);
    throw error;
  }
};

export const useChat = () => {
  return {
    getRecentConversations,
    getMessages,
    sendMessage,
    sendFileMessage,
    getFileUrl,
  };
};
