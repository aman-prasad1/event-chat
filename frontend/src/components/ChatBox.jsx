import React, { useEffect, useRef, useState } from "react";
import { RiSendPlane2Fill } from "react-icons/ri";
import { chatStore } from "../store/chatStore";
import { userStore } from "../store/userStore";
import { useChat } from "../hooks/useChat";

const ChatBox = () => {
  const { selectedConversation, messages, messagesLoading, addMessage } = chatStore();
  const { user } = userStore();
  const { getMessages, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation?.conversationId) {
      getMessages(selectedConversation.conversationId);
    }
  }, [selectedConversation?.conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when conversation opens
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedConversation?.conversationId]);

  // Get other user info
  const otherUser = selectedConversation?.members?.[0];
  const otherName = otherUser
    ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() || otherUser.username
    : "Chat";

  const getInitials = (member) => {
    if (member?.first_name && member?.last_name) {
      return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    }
    if (member?.username) return member.username[0].toUpperCase();
    return "U";
  };

  // Format message timestamp
  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  // Handle send
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Optimistic update
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
    setSending(true);

    try {
      await sendMessage(selectedConversation.conversationId, text);
      // Refetch to get the real message from server
      await getMessages(selectedConversation.conversationId);
    } catch (error) {
      // Could mark the temp message as failed here
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading state
  if (messagesLoading && messages.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col transition-colors duration-300"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="h-4 w-28 rounded animate-pulse" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>
        {/* Messages skeleton */}
        <div className="flex-1 p-5 flex flex-col gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div
                className="h-10 rounded-2xl animate-pulse"
                style={{
                  backgroundColor: 'var(--color-border)',
                  width: `${Math.random() * 30 + 20}%`,
                }}
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
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {/* Chat Header */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt={otherName} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span
              className="flex items-center justify-center w-full h-full text-xs font-bold text-white rounded-full"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))' }}
            >
              {getInitials(otherUser)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
            {otherName}
          </p>
          {otherUser?.username && (
            <p className="text-xs m-0" style={{ color: 'var(--color-text-secondary)' }}>
              @{otherUser.username}
            </p>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No messages yet. Say hi! 👋
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSelf = msg.senderId === user?.id;
            const showTime = idx === 0 ||
              new Date(msg.createdAt).getTime() - new Date(messages[idx - 1]?.createdAt).getTime() > 300000;

            return (
              <div key={msg.id}>
                {showTime && (
                  <div className="text-center my-3">
                    <span
                      className="text-[11px] px-2.5 py-0.5 rounded-full"
                      style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-border)' }}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-0.5`}>
                  <div
                    className={`max-w-[70%] px-3.5 py-2 text-sm leading-relaxed break-words ${
                      isSelf
                        ? "rounded-2xl rounded-br-md text-white"
                        : "rounded-2xl rounded-bl-md"
                    } ${msg._pending ? "opacity-60" : ""}`}
                    style={
                      isSelf
                        ? { background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))' }
                        : { backgroundColor: 'var(--color-border)', color: 'var(--color-text-primary)' }
                    }
                  >
                    {msg.type === "file" ? (
                      <span>📎 {msg.content?.filename || "File"}</span>
                    ) : (
                      msg.content?.text || ""
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="shrink-0 px-4 py-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-transparent border-none outline-none text-sm py-1"
            style={{
              color: 'var(--color-text-primary)',
              maxHeight: '120px',
              fontFamily: 'var(--font-sans)',
              lineHeight: '1.5',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: '#fff',
            }}
          >
            <RiSendPlane2Fill size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
