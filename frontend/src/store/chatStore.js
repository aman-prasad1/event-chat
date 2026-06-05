import { create } from 'zustand';

const chatStore = create((set) => ({
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  messages: [],
  messagesLoading: false,
  pendingStatusUpdates: {},
  setConversations: (conversations) => set({ conversations }),
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setMessages: (messages) => set({ messages }),
  prependMessages: (messages) => set((state) => ({ messages: [...messages, ...state.messages] })),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  markPendingFalse: (tempId) => set((state) => ({
    messages: state.messages.map(msg => msg.id === tempId ? { ...msg, _pending: false } : msg)
  })),
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
  setLatestMessage: (conversationId, message) => set((state) => {
    const conversations = state.conversations.map(conv => {
      if (conv.conversationId === conversationId) {
        return {
          ...conv,
          latestMessage: message,
        };
      }
      return conv;
    });
    return { conversations };
  }),
  incrementUnreadCount: (conversationId, messageId) => set((state) => {
    const conversations = state.conversations.map(conv => {
      if (conv.conversationId === conversationId) {
        const existingUnreadIds = conv.unreadMessageIds || [];
        return {
          ...conv,
          unreadCount: (conv.unreadCount || 0) + 1,
          unreadMessageIds: [...existingUnreadIds, messageId],
        };
      }
      return conv;
    });
    return { conversations };
  }),
  handleMessageSent: (savedMessage) => set((state) => {
    let contentObj = savedMessage.content;
    if (typeof contentObj === 'string') {
      try {
        contentObj = JSON.parse(contentObj);
      } catch (e) {
        console.error("Failed to parse content in handleMessageSent:", e);
      }
    }
    const tempId = contentObj?.tempId;
    if (!tempId) {
      console.warn("No tempId found in contentObj:", contentObj);
      return {};
    }

    const exists = state.messages.some(msg => msg.id === savedMessage.id);
    if (exists) return {};

    // Apply any pending status updates received before database confirmation
    let initialStatuses = savedMessage.statuses || [];
    const pendingUpdatesForMsg = state.pendingStatusUpdates[savedMessage.id];
    if (pendingUpdatesForMsg && pendingUpdatesForMsg.length > 0) {
      pendingUpdatesForMsg.forEach(update => {
        const idx = initialStatuses.findIndex(s => s.userId === update.userId);
        if (idx > -1) {
          initialStatuses[idx] = { ...initialStatuses[idx], status: update.status };
        } else {
          initialStatuses.push({ userId: update.userId, status: update.status });
        }
      });
    }

    // Clean up applied pending updates
    const newPendingStatusUpdates = { ...state.pendingStatusUpdates };
    delete newPendingStatusUpdates[savedMessage.id];

    let replaced = false;
    const messages = state.messages.map(msg => {
      if (msg.id === tempId) {
        replaced = true;
        return {
          ...msg,
          id: savedMessage.id,
          createdAt: savedMessage.createdAt,
          _pending: false,
          statuses: initialStatuses
        };
      }
      return msg;
    });

    if (!replaced) {
      if (state.selectedConversation?.conversationId === savedMessage.conversationId) {
        return { 
          messages: [...state.messages, { ...savedMessage, statuses: initialStatuses }],
          pendingStatusUpdates: newPendingStatusUpdates
        };
      }
      return { pendingStatusUpdates: newPendingStatusUpdates };
    }

    const conversations = state.conversations.map(conv => {
      if (conv.latestMessage?.id === tempId) {
        return {
          ...conv,
          latestMessage: {
            ...conv.latestMessage,
            id: savedMessage.id,
            createdAt: savedMessage.createdAt,
            _pending: false,
            statuses: initialStatuses
          }
        };
      }
      return conv;
    });

    return { messages, conversations, pendingStatusUpdates: newPendingStatusUpdates };
  }),
  updateMessageStatus: (messageId, status, userId) => set((state) => {
    const msgExists = state.messages.some(msg => msg.id === messageId);
    
    let pendingUpdates = { ...state.pendingStatusUpdates };
    if (!msgExists) {
      const existing = pendingUpdates[messageId] || [];
      pendingUpdates[messageId] = [...existing.filter(u => u.userId !== userId), { userId, status }];
    }

    const messages = state.messages.map(msg => {
      if (msg.id === messageId) {
        const existingStatuses = msg.statuses || [];
        const statusIndex = existingStatuses.findIndex(s => s.userId === userId);
        let newStatuses;
        if (statusIndex > -1) {
          newStatuses = existingStatuses.map((s, idx) =>
            idx === statusIndex ? { ...s, status } : s
          );
        } else {
          newStatuses = [...existingStatuses, { userId, status }];
        }
        return { ...msg, statuses: newStatuses };
      }
      return msg;
    });

    const conversations = state.conversations.map(conv => {
      if (conv.latestMessage?.id === messageId) {
        const existingStatuses = conv.latestMessage.statuses || [];
        const statusIndex = existingStatuses.findIndex(s => s.userId === userId);
        let newStatuses;
        if (statusIndex > -1) {
          newStatuses = existingStatuses.map((s, idx) =>
            idx === statusIndex ? { ...s, status } : s
          );
        } else {
          newStatuses = [...existingStatuses, { userId, status }];
        }
        return {
          ...conv,
          latestMessage: {
            ...conv.latestMessage,
            statuses: newStatuses
          }
        };
      }
      return conv;
    });

    return { messages, conversations, pendingStatusUpdates: pendingUpdates };
  }),
}));

export { chatStore };
