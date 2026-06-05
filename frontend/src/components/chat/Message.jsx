import { RiDownloadLine, RiFileTextLine, RiCheckLine, RiCheckDoubleLine, RiTimeLine } from "react-icons/ri";
import Avatar from "../common/Avatar";

const Message = ({ msg, isSelf, messageTime, onGetFileUrl, otherUser }) => {

  const getMessageStatus = () => {
    if (msg._pending) return "pending";
    if (!msg.statuses || msg.statuses.length === 0) return "sent";

    const isAllSeen = msg.statuses.every(s => s.status === "seen");
    if (isAllSeen) return "seen";

    const isAllDeliveredOrSeen = msg.statuses.every(s => s.status === "delivered" || s.status === "seen");
    if (isAllDeliveredOrSeen) return "delivered";

    return "sent";
  };

  const renderStatusIcon = () => {
    const status = getMessageStatus();
    switch (status) {
      case "pending":
        return <RiTimeLine size={13} style={{ color: "var(--color-text-secondary)", opacity: 0.8 }} title="Pending" />;
      case "sent":
        return <RiCheckLine size={15} style={{ color: "var(--color-text-secondary)" }} title="Sent" />;
      case "delivered":
        return <RiCheckDoubleLine size={15} style={{ color: "var(--color-text-secondary)" }} title="Delivered" />;
      case "seen":
        return <RiCheckDoubleLine size={15} style={{ color: "#3b82f6" }} title="Seen" />;
      default:
        return null;
    }
  };

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

        <div className="flex items-center gap-1 mt-1 px-1">
          {messageTime && (
            <span
              className="text-[10px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {messageTime}
            </span>
          )}
          {isSelf && renderStatusIcon()}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Message;
