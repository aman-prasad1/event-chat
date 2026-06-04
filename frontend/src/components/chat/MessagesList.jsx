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
      <div className="flex justify-center py-2">
        <span
          className="text-[11px] px-3 py-1 rounded-full"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-border)' }}
        >
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
              user={user}
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
