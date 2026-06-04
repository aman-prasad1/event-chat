import React from "react";
import { RiDownloadLine, RiFileTextLine } from "react-icons/ri";
import Avatar from "./common/Avatar";

const Message = ({ msg, user, isSelf, messageTime, onGetFileUrl, otherUser }) => {


  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`flex gap-2 items-end ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar - only for other user */}
        {!isSelf && (
          <Avatar user={otherUser} size={28} className="mb-0.5" />
        )}

        <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
        {msg.type === "file" ? (
          <div
            className={`rounded-2xl overflow-hidden max-w-xs sm:max-w-sm md:max-w-md ${msg._pending ? "opacity-60" : ""}`}
            style={{
              ...(isSelf
                ? {
                    backgroundColor: "var(--color-msg-self-bg)",
                  }
                : { backgroundColor: "var(--color-msg-other-bg)" }),
            }}
          >
            <div
              onClick={() => onGetFileUrl(msg)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
              style={{
                backgroundColor: isSelf
                  ? "rgba(0,0,0,0.15)"
                  : "rgba(0,0,0,0.06)",
                minWidth: "120px",
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
                style={{
                  backgroundColor: isSelf
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(0,0,0,0.08)",
                }}
              >
                <RiFileTextLine
                  size={22}
                  style={{
                    color: isSelf ? "var(--color-msg-self-text)" : "var(--color-text-secondary)",
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium m-0 truncate"
                  style={{
                    color: isSelf ? "var(--color-msg-self-text)" : "var(--color-text-primary)",
                  }}
                  title={msg.content?.filename}
                >
                  {msg.content?.filename || "File"}
                </p>
                <p
                  className="text-[11px] m-0 mt-0.5"
                  style={{
                    color: isSelf
                      ? "rgba(0,0,0,0.5)"
                      : "var(--color-text-secondary)",
                  }}
                >
                  File
                </p>
              </div>

              <button
                className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer transition-all duration-200 hover:scale-110"
                style={{
                  backgroundColor: isSelf
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(0,0,0,0.08)",
                  color: isSelf ? "var(--color-msg-self-text)" : "var(--color-text-secondary)",
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
            className={`px-3.5 py-2 text-[15px] font-medium leading-relaxed break-all whitespace-pre-wrap max-w-xs sm:max-w-sm md:max-w-md ${
              isSelf
                ? "rounded-2xl rounded-br-md"
                : "rounded-2xl rounded-bl-md"
            } ${msg._pending ? "opacity-60" : ""}`}
            style={
              isSelf
                ? {
                    backgroundColor: "var(--color-msg-self-bg)",
                    color: "var(--color-msg-self-text)",
                  }
                : {
                    backgroundColor: "var(--color-msg-other-bg)",
                    color: "var(--color-text-primary)",
                  }
            }
          >
            {msg.content?.text || ""}
          </div>
        )}

        {messageTime && (
          <span
            className="text-[10px] mt-1 px-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {messageTime}
          </span>
        )}
      </div>
      </div>
    </div>
  );
};

export default Message;
