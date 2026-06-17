import React from "react";
import { formatMessageTime, formatDateSeparator } from "../../utils/formatters";
import Message from "./Message";


// Scrollable messages list with date separators, loading indicator, and empty state.
const MessagesList = ({
  messages,
  user,
  otherUser,
  isLoadingOlder,
  onScroll,
  containerRef,
  endRef,
  onGetFileUrl,
}) => (
  <div
    ref={containerRef}
    onScroll={onScroll}
    className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1 chat-scroll"
  >
    {isLoadingOlder && (
      <div className="w-full overflow-hidden" style={{ height: '3px', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '70%',
            borderRadius: '0 2px 2px 0',
            background: 'var(--color-accent-primary)',
            animation: 'top-loader-pulse 1.2s ease-in-out infinite alternate',
            boxShadow: '0 0 8px color-mix(in srgb, var(--color-accent-primary) 40%, transparent)',
          }}
        />
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
        const previousDate = messages[idx - 1]?.createdAt
          ? new Date(messages[idx - 1].createdAt)
          : null;
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
                  style={{
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-border)',
                  }}
                >
                  {formatDateSeparator(msg.createdAt)}
                </span>
              </div>
            )}
            <Message
              msg={msg}
              isSelf={isSelf}
              messageTime={messageTime}
              onGetFileUrl={onGetFileUrl}
              otherUser={otherUser}
            />
          </div>
        );
      })
    )}
    <div ref={endRef} />
  </div>
);

export default MessagesList;
