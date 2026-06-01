import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RiSendPlane2Fill, RiAttachment2, RiImageLine, RiVideoLine, RiMusicLine, RiFilePdfLine, RiFileExcel2Line, RiFileWord2Line, RiFileZipLine, RiErrorWarningLine } from "react-icons/ri";
import { IoClose, IoCloudyNight } from "react-icons/io5";
import InputEmoji from "react-input-emoji";
import { chatStore } from "../store/chatStore";
import { userStore } from "../store/userStore";
import { useChat } from "../hooks/useChat";
import { ToastContainer, toast } from "react-toastify";
import { socket } from "../socketIo";
import Message from "./Message";
import "./ChatBox.css";

const ChatBox = () => {
  const { selectedConversation, messages, messagesLoading, setMessages, prependMessages, addMessage, markMessageAsRead, markPendingFalse, setLatestMessage } = chatStore();
  const { user } = userStore();
  const { getMessages, sendMessage, sendFileMessage, getFileUrl } = useChat();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileSizeWarning, setFileSizeWarning] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingScrollAdjustmentRef = useRef(null);


  const toastRef = useRef(null);

  const scrollMessagesToBottom = (behavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  // Fetch messages when conversation changes
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
          if (!isActive) {
            return;
          }

          // API returns messages in desc order, reverse for chronological display
          setMessages([...data.messages].reverse());
          setNextCursor(data.nextCursor);

          // mark all messages as seen
          for(const msgId of selectedConversation.unreadMessageIds || []) {
            socket.emit("message_seen", { messageId: msgId });
          }
          markMessageAsRead(selectedConversation.conversationId);
        } catch (error) {
          if (isActive) {
            pendingScrollAdjustmentRef.current = null;
          }
          console.error("Failed to load messages:", error);
        }
      })();
    }

    return () => {
      isActive = false;
    };
  }, [selectedConversation]);

  const loadOlderMessages = async () => {
    if (!selectedConversation?.conversationId || !nextCursor || isLoadingOlder) {
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

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

    if (!container || isLoadingOlder || !nextCursor) {
      return;
    }

    if (container.scrollTop <= 40) {
      loadOlderMessages();
    }
  };

  // Preserve scroll position when older messages are prepended and keep the chat pinned to the bottom otherwise
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    const pendingAdjustment = pendingScrollAdjustmentRef.current;
    if (pendingAdjustment) {
      const nextScrollTop = container.scrollHeight - pendingAdjustment.scrollHeight + pendingAdjustment.scrollTop;
      container.scrollTop = nextScrollTop;
      pendingScrollAdjustmentRef.current = null;
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      scrollMessagesToBottom("auto");
    });

    return () => window.cancelAnimationFrame(frameId);
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

  const formatDateSeparator = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (left, right) =>
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate();

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const valid = [];
    const rejected = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(file.name);
      } else {
        valid.push(file);
      }
    }

    if (rejected.length > 0) {
      setFileSizeWarning(
        `${rejected.join(", ")} ${rejected.length === 1 ? "exceeds" : "exceed"} the 10 MB limit`
      );
      setTimeout(() => setFileSizeWarning(""), 4000);
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file) => {
    const type = file.type;
    if (type.startsWith("image/")) return <RiImageLine size={14} />;
    if (type.startsWith("video/")) return <RiVideoLine size={14} />;
    if (type.startsWith("audio/")) return <RiMusicLine size={14} />;
    if (type === "application/pdf") return <RiFilePdfLine size={14} />;
    if (type.includes("spreadsheet") || type.includes("excel")) return <RiFileExcel2Line size={14} />;
    if (type.includes("document") || type.includes("word")) return <RiFileWord2Line size={14} />;
    if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return <RiFileZipLine size={14} />;
    return <RiAttachment2 size={14} />;
  };

  // Handle send
  const handleSend = async (messageText = input) => {
    const text = messageText.trim();
    const hasFiles = selectedFiles.length > 0;
    if ((!text && !hasFiles) || sending) return;

    setSending(true);

    try {
      // Send files first
      if (hasFiles) {
        for (const file of selectedFiles) {
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
        setSelectedFiles([]);
      }

      // Send text if present
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

        // update the latest message preview in the sidebar
        setLatestMessage(selectedConversation.conversationId, {
          ...tempMessage,
          content: { text },
        });
      }

    } catch (error) {
      // TODO: Mark the temp messages as failed here
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Convert sanitized HTML from InputEmoji (which uses <br> for newlines)
  // into plain text with newline characters before sending.
  const htmlToPlain = (html) => {
    if (!html) return "";
    // replace various br forms with newlines
    let s = html.replace(/<br\s*\/?>/gi, "\n");
    s = s.replace(/<\/?div>/gi, "\n");
    // strip any remaining tags
    s = s.replace(/<[^>]*>/g, "");
    // collapse multiple newlines
    s = s.replace(/\n{3,}/g, "\n\n");
    return s;
  };

  const handleGetFileUrl = async (msg) => {
    try {
      toastRef.current = toast.loading("Downloading file...");

      const url = await getFileUrl(selectedConversation.conversationId, msg.id);

      const fileResponse = await fetch(url);
      const blob = await fileResponse.blob();

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = msg.content.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);

      toast.dismiss(toastRef.current);

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to get file URL. Please try again.");
    }
  };

  // Loading state
  if (messagesLoading && messages.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col transition-colors duration-300"
        style={{ backgroundColor: 'var(--color-chatbox-bg, var(--color-primary))' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 h-[72px] border-b"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary)' }}
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
      style={{ backgroundColor: 'var(--color-chatbox-bg, var(--color-primary))' }}
    >
      <ToastContainer />
      {/* Chat Header */}
      <div
        className="flex items-center gap-3 px-5 h-[72px] border-b shrink-0"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary)' }}
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
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1 chat-scroll"
      >
        {isLoadingOlder && (
          <div className="flex justify-center py-2">
            <span className="text-[11px] px-3 py-1 rounded-full" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-border)' }}>
              Loading earlier messages...
            </span>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No messages yet. Say hi!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSelf = msg.senderId === user?.id;
            const currentDate = new Date(msg.createdAt);
            const previousDate = messages[idx - 1]?.createdAt ? new Date(messages[idx - 1].createdAt) : null;
            const showDateSeparator =
              idx === 0 ||
              !previousDate ||
              currentDate.getFullYear() !== previousDate.getFullYear() ||
              currentDate.getMonth() !== previousDate.getMonth() ||
              currentDate.getDate() !== previousDate.getDate();
            const messageTime = formatMessageTime(msg.createdAt);

            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <span
                      className="text-[11px] px-3 py-1 rounded-full"
                      style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-border)' }}
                    >
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <Message
                  msg={msg}
                  user={user}
                  isSelf={isSelf}
                  messageTime={messageTime}
                  onGetFileUrl={handleGetFileUrl}
                  otherUser={otherUser}
                />
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
        {/* File Size Warning */}
        {fileSizeWarning && (
          <div
            className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-xs font-medium animate-pulse"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <RiErrorWarningLine size={16} />
            <span className="flex-1">{fileSizeWarning}</span>
            <button
              onClick={() => setFileSizeWarning("")}
              className="shrink-0 border-none bg-transparent cursor-pointer text-xs font-bold opacity-60 hover:opacity-100"
              style={{ color: '#ef4444' }}
            >
              <IoClose size={14} />
            </button>
          </div>
        )}

        {/* File Preview Strip */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg text-xs max-w-50 group transition-all duration-200"
                style={{
                  backgroundColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <span className="text-sm">{getFileIcon(file)}</span>
                <span className="truncate flex-1 font-medium" title={file.name}>{file.name}</span>
                <span className="shrink-0 opacity-60" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatFileSize(file.size)}
                </span>
                <button
                  onClick={() => removeFile(idx)}
                  className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-150 ml-0.5"
                  style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}
                  title="Remove file"
                >
                  <IoClose size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary)' }}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}
            title="Attach files"
            type="button"
          >
            <RiAttachment2 size={22} />
          </button>

          <div className="flex-1 chatbox-emoji-input-shell">
            <InputEmoji
              ref={inputRef}
              value={input}
              onChange={setInput}
              onEnter={(html) => handleSend(htmlToPlain(html))}
              placeholder="Type a message..."
              cleanOnEnter={true}
              shouldReturn={true}
              height={44}
              borderRadius={12}
              borderColor="transparent"
              background="transparent"
              color="var(--color-text-primary)"
              placeholderColor="var(--color-text-secondary)"
              fontSize={14}
              fontFamily="var(--font-sans)"
              inputClass="chatbox-emoji-input"
              theme="auto"
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && selectedFiles.length === 0) || sending}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-send-btn-bg)',
              color: 'var(--color-send-btn-text)',
            }}
            type="button"
          >
            <RiSendPlane2Fill size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
