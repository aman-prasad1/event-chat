import React, { useEffect, useRef, useState } from "react";
import { RiSendPlane2Fill, RiAttachment2, RiDownloadLine, RiFileTextLine, RiImageLine, RiVideoLine, RiMusicLine, RiFilePdfLine, RiFileExcel2Line, RiFileWord2Line, RiFileZipLine, RiErrorWarningLine } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import { chatStore } from "../store/chatStore";
import { userStore } from "../store/userStore";
import { useChat } from "../hooks/useChat";

const ChatBox = () => {
  const { selectedConversation, messages, messagesLoading, addMessage } = chatStore();
  const { user } = userStore();
  const { getMessages, sendMessage, sendFileMessage } = useChat();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileSizeWarning, setFileSizeWarning] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

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
  const handleSend = async () => {
    const text = input.trim();
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
      }

      // Refetch to get real messages from server
      await getMessages(selectedConversation.conversationId);
    } catch (error) {
      // Could mark the temp messages as failed here
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
              No messages yet. Say hi!
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
                  {msg.type === "file" ? (
                    <div
                      className={`max-w-[70%] rounded-2xl overflow-hidden ${msg._pending ? "opacity-60" : ""}`}
                      style={{
                        ...(isSelf
                          ? { background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))' }
                          : { backgroundColor: 'var(--color-border)' }),
                        padding: '10px',
                        minWidth: '240px',
                      }}
                    >
                      {/* Inner darker container */}
                      <div
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                        style={{
                          backgroundColor: isSelf ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)',
                        }}
                      >
                        {/* File icon */}
                        <div
                          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
                          style={{
                            backgroundColor: isSelf ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
                          }}
                        >
                          <RiFileTextLine size={22} style={{ color: isSelf ? '#fff' : 'var(--color-text-secondary)' }} />
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium m-0 truncate"
                            style={{ color: isSelf ? '#fff' : 'var(--color-text-primary)' }}
                            title={msg.content?.filename}
                          >
                            {msg.content?.filename || "File"}
                          </p>
                          <p
                            className="text-[11px] m-0 mt-0.5"
                            style={{ color: isSelf ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)' }}
                          >
                            File
                          </p>
                        </div>

                        {/* Download icon */}
                        <button
                          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer transition-all duration-200 hover:scale-110"
                          style={{
                            backgroundColor: isSelf ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
                            color: isSelf ? '#fff' : 'var(--color-text-secondary)',
                          }}
                          title="Download"
                          type="button"
                        >
                          <RiDownloadLine size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
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
                      {msg.content?.text || ""}
                    </div>
                  )}
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
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg text-xs max-w-[200px] group transition-all duration-200"
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
            <RiAttachment2 size={18} />
          </button>

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
            disabled={(!input.trim() && selectedFiles.length === 0) || sending}
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
