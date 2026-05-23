import { create } from 'zustand';

const chatStore = create((set) => ({
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  setConversations: (conversations) => set({ conversations }),
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  clearChat: () => set({ conversations: [], selectedConversation: null }),
}));

export { chatStore };
