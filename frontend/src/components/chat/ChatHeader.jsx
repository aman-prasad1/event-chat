import React from "react";
import { RiArrowLeftLine } from "react-icons/ri";
import Avatar from "../common/Avatar";

// Header bar showing the other user's avatar, name, and a mobile back button.
const ChatHeader = ({ otherUser, otherName, onBack }) => (
  <div
    className="flex items-center gap-3 px-5 h-[72px] border-b shrink-0"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary)' }}
  >
    {/* Back button - mobile only */}
    <button
      onClick={onBack}
      className="lg:hidden shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer transition-all duration-200 hover:scale-105"
      style={{ backgroundColor: 'transparent', color: 'var(--color-text-primary)' }}
      type="button"
    >
      <RiArrowLeftLine size={22} />
    </button>
    <Avatar user={otherUser} size={36} />
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
);

export default ChatHeader;
