import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { chatStore } from "../store/chatStore";
import { userStore } from "../store/userStore";
import { useChat } from "../hooks/useChat";
import { ToastContainer, toast } from "react-toastify";
import { socket } from "../socketIo";
import ChatHeader from "./chat/ChatHeader";
import MessagesList from "./chat/MessagesList";
import ChatInput from "./chat/ChatInput";
import "./ChatBox.css";

const ChatBox = () => {
  const {
    selectedConversation, messages, messagesLoading,
    setMessages, prependMessages, addMessage,
    markMessageAsRead, markPendingFalse, setLatestMessage,
    setSelectedConversation,
  } = chatStore();
  const { user } = userStore();
  const { getMessages, sendMessage, sendFileMessage, getFileUrl } = useChat();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const pendingScrollAdjustmentRef = useRef(null);
  const toastRef = useRef(null);

  // ─── Derived data ───
  const otherUser = selectedConversation?.members?.[0];
  const otherName = otherUser
    ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() || otherUser.username
    : "Chat";

  // ─── Scrolling helpers ───
  const scrollMessagesToBottom = (behavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  // ─── Fetch messages on conversation change ───
  useEffect(() => {
    let isActive = true;
    pendingScrollAdjustmentRef.current = null;

    if (selectedConversation?.conversationId) {
      setMessages([]);
      setNextCursor(null);
      setIsLoadingOlder(false);

      (async () => {
        try {
          const data = await getMessages(selectedConversation.conversationId);
          if (!isActive) return;

          setMessages([...data.messages].reverse());
          setNextCursor(data.nextCursor);

          for (const msgId of selectedConversation.unreadMessageIds || []) {
            socket.emit("message_seen", { messageId: msgId });
          }
          markMessageAsRead(selectedConversation.conversationId);
        } catch (error) {
          if (isActive) pendingScrollAdjustmentRef.current = null;
          console.error("Failed to load messages:", error);
        }
      })();
    }

    return () => { isActive = false; };
  }, [selectedConversation]);

  // ─── Infinite scroll for older messages ───
  const loadOlderMessages = async () => {
    if (!selectedConversation?.conversationId || !nextCursor || isLoadingOlder) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    pendingScrollAdjustmentRef.current = {
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };

    setIsLoadingOlder(true);
    try {
      const data = await getMessages(selectedConversation.conversationId, nextCursor);
      prependMessages([...data.messages].reverse());
      setNextCursor(data.nextCursor);
    } catch (error) {
      pendingScrollAdjustmentRef.current = null;
      console.error("Failed to load older messages:", error);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingOlder || !nextCursor) return;
    if (container.scrollTop <= 40) loadOlderMessages();
  };

  // ─── Preserve scroll position on prepend, pin to bottom otherwise ───
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const pending = pendingScrollAdjustmentRef.current;
    if (pending) {
      container.scrollTop = container.scrollHeight - pending.scrollHeight + pending.scrollTop;
      pendingScrollAdjustmentRef.current = null;
      return;
    }

    const frameId = window.requestAnimationFrame(() => scrollMessagesToBottom("auto"));
    return () => window.cancelAnimationFrame(frameId);
  }, [messages]);

  // ─── Focus input on conversation open ───
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedConversation?.conversationId]);

  // ─── Send handler (called by ChatInput) ───
  const handleSend = async (text, files = []) => {
    if ((!text && files.length === 0) || sending) return;
    setSending(true);

    try {
      // Send files
      for (const file of files) {
        const tempFileMsg = {
          id: `temp-file-${Date.now()}-${Math.random()}`,
          senderId: user.id,
          conversationId: selectedConversation.conversationId,
          type: "file",
          content: { filename: file.name },
          createdAt: new Date().toISOString(),
          _pending: true,
        };
        addMessage(tempFileMsg);
        await sendFileMessage(selectedConversation.conversationId, file);
        markPendingFalse(tempFileMsg.id);
      }

      // Send text
      if (text) {
        const tempMessage = {
          id: `temp-${Date.now()}`,
          senderId: user.id,
          conversationId: selectedConversation.conversationId,
          type: "text",
          content: { text },
          createdAt: new Date().toISOString(),
          _pending: true,
        };
        addMessage(tempMessage);
        setInput("");
        await sendMessage(selectedConversation.conversationId, text);
        markPendingFalse(tempMessage.id);
        setLatestMessage(selectedConversation.conversationId, { ...tempMessage, content: { text } });
      }
    } catch (error) {
      // TODO: Mark the temp messages as failed
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // ─── File download ───
  const handleGetFileUrl = async (msg) => {
    try {
      toastRef.current = toast.loading("Downloading file...");
      const url = await getFileUrl(selectedConversation.conversationId, msg.id);
      const blob = await (await fetch(url)).blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = msg.content.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.dismiss(toastRef.current);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to get file URL. Please try again.");
    }
  };

  // ─── Loading skeleton ───
  if (messagesLoading && messages.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col transition-colors duration-300"
        style={{ backgroundColor: 'var(--color-chatbox-bg, var(--color-primary))' }}
      >
        <div
          className="flex items-center gap-3 px-5 h-[72px] border-b"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary)' }}
        >
          <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="h-4 w-28 rounded animate-pulse" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>
        <div className="flex-1 p-5 flex flex-col gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div
                className="h-10 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'var(--color-border)', width: `${Math.random() * 30 + 20}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-chatbox-bg, var(--color-primary))' }}
    >
      <ToastContainer />

      <ChatHeader
        otherUser={otherUser}
        otherName={otherName}
        onBack={() => setSelectedConversation(null)}
      />

      <MessagesList
        messages={messages}
        user={user}
        otherUser={otherUser}
        isLoadingOlder={isLoadingOlder}
        onScroll={handleMessagesScroll}
        containerRef={messagesContainerRef}
        endRef={messagesEndRef}
        onGetFileUrl={handleGetFileUrl}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        sending={sending}
        onSend={handleSend}
        inputRef={inputRef}
      />
    </div>
  );
};

export default ChatBox;
