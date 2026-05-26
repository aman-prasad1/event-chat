import { create } from 'zustand';

const chatStore = create((set, get) => ({
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  messages: [],
  messagesLoading: false,
  setConversations: (conversations) => set({ conversations }),
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMessages: (messages) => set({ messages }),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearChat: () => set({ conversations: [], selectedConversation: null, messages: [] }),
  markMessageAsRead: (conversationId) => set((state) => {
    const conversations = state.conversations.map(conv => {
      if (conv.conversationId === conversationId) {
        return {
          ...conv,
          unreadCount: 0,
          unreadMessageIds: [],
        };
      }
      return conv;
    });
    return { conversations };
  }),
}));

export { chatStore };
