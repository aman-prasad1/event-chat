import React from "react";
import { RiDownloadLine, RiFileTextLine } from "react-icons/ri";

const Message = ({ msg, user, isSelf, messageTime, onGetFileUrl }) => {
  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-2`}>
      <div className="flex gap-2">
        {isSelf && messageTime && (
          <div
            className="text-[10px] whitespace-nowrap shrink-0 flex items-center"
            style={{
              color: "var(--color-text-secondary)",
              transform: "translateY(0.85rem)",
              marginRight: "6px",
            }}
          >
            {messageTime}
          </div>
        )}

        {msg.type === "file" ? (
          <div
            className={`rounded-2xl overflow-hidden max-w-xs sm:max-w-sm md:max-w-md ${msg._pending ? "opacity-60" : ""}`}
            style={{
              ...(isSelf
                ? {
                    background:
                      "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))",
                  }
                : { backgroundColor: "var(--color-border)" }),
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
                    color: isSelf ? "#fff" : "var(--color-text-secondary)",
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium m-0 truncate"
                  style={{
                    color: isSelf ? "#fff" : "var(--color-text-primary)",
                  }}
                  title={msg.content?.filename}
                >
                  {msg.content?.filename || "File"}
                </p>
                <p
                  className="text-[11px] m-0 mt-0.5"
                  style={{
                    color: isSelf
                      ? "rgba(255,255,255,0.7)"
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
                  color: isSelf ? "#fff" : "var(--color-text-secondary)",
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
            className={`px-3.5 py-2 text-sm leading-relaxed break-all whitespace-pre-wrap max-w-xs sm:max-w-sm md:max-w-md ${
              isSelf
                ? "rounded-2xl rounded-br-md text-white"
                : "rounded-2xl rounded-bl-md"
            } ${msg._pending ? "opacity-60" : ""}`}
            style={
              isSelf
                ? {
                    background:
                      "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))",
                  }
                : {
                    backgroundColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }
            }
          >
            {msg.content?.text || ""}
          </div>
        )}

        {!isSelf && messageTime && (
          <div
            className="text-[10px] whitespace-nowrap shrink-0 flex items-center"
            style={{
              color: "var(--color-text-secondary)",
              transform: "translateY(0.85rem)",
              marginLeft: "6px",
            }}
          >
            {messageTime}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
