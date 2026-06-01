import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RiChat3Line, RiAttachment2, RiMenuLine, RiCloseLine, RiSettings4Line, RiLogoutBoxRLine, RiSunLine, RiMoonLine } from "react-icons/ri";
import { chatStore } from "../store/chatStore";
import { userStore } from "../store/userStore";
import { themeStore } from "../store/themeStore";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import SearchBar from "./SearchBar";

const RecentChatsSideBar = () => {
  const { conversations, selectedConversation, isLoading, setSelectedConversation } = chatStore();
  const { user } = userStore();
  const { theme, toggleTheme } = themeStore();
  const { getRecentConversations } = useChat();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {}
    finally {
      setMenuOpen(false);
      navigate("/login");
    }
  };

  const getUserInitials = () => {
    if (!user) return "";
    if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    if (user.username) return user.username[0].toUpperCase();
    return "U";
  };

  // Mobile menu dropdown
  const MobileMenu = () => (
    <div className="relative lg:hidden" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-xl border-none cursor-pointer transition-all duration-200"
        style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}
        type="button"
      >
        {menuOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] min-w-[220px] rounded-xl overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--color-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 15px -3px rgba(0,0,0,0.08)',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span
                  className="flex items-center justify-center w-full h-full text-[11px] font-bold text-white rounded-full"
                  style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))' }}
                >
                  {getUserInitials()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.username}
              </p>
              <p className="text-xs mt-0.5 m-0" style={{ color: 'var(--color-text-secondary)' }}>
                @{user?.username}
              </p>
            </div>
          </div>
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />

          {/* Theme toggle */}
          <button
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm bg-transparent border-none cursor-pointer transition-all duration-150"
            style={{ color: 'var(--color-text-secondary)' }}
            onClick={() => { toggleTheme(); setMenuOpen(false); }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            {theme === "light" ? <RiMoonLine size={16} /> : <RiSunLine size={16} />}
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>

          {/* Settings */}
          <button
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm bg-transparent border-none cursor-pointer transition-all duration-150"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <RiSettings4Line size={16} />
            <span>Settings</span>
          </button>

          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />

          {/* Logout */}
          <button
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm bg-transparent border-none cursor-pointer transition-all duration-150"
            style={{ color: 'var(--color-text-secondary)' }}
            onClick={handleLogout}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <RiLogoutBoxRLine size={16} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    getRecentConversations();
  }, []);

  // Format relative timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get display name for the other user in the conversation
  const getDisplayInfo = (members) => {
    if (!members || members.length === 0) return { name: "Unknown", username: "", avatar: null };
    const other = members[0];
    return {
      name: `${other.first_name || ""} ${other.last_name || ""}`.trim() || other.username,
      username: other.username,
      avatar: other.avatar_url,
      initials: getInitials(other),
    };
  };

  const getInitials = (member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    }
    if (member.username) return member.username[0].toUpperCase();
    return "U";
  };

  // Get message preview text
  const getPreview = (latestMessage) => {
    if (!latestMessage) return "No messages yet";
    if (latestMessage.type === "file") return <><RiAttachment2 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} /> File</>;
    const text = latestMessage.content?.text || "";
    return text.length > 40 ? text.slice(0, 40) + "…" : text;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <aside
        className="w-[476px] min-w-[476px] max-lg:w-full max-lg:min-w-full flex flex-col overflow-hidden border-r transition-colors duration-300"
        style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
      >
        <div className="px-5 flex items-center justify-between h-[72px]">
          <h2 className="text-[22px] font-bold m-0 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Chats</h2>
          <MobileMenu />
        </div>
        <SearchBar onSearch={setSearchQuery} />
        <div className="flex-1 overflow-y-auto p-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 pointer-events-none">
              <div
                className="w-11 h-11 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--color-border)' }}
              />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div
                  className="h-3 rounded-md w-3/5 animate-pulse"
                  style={{ backgroundColor: 'var(--color-border)' }}
                />
                <div
                  className="h-3 rounded-md w-[85%] animate-pulse"
                  style={{ backgroundColor: 'var(--color-border)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // Empty state
  if (!conversations || conversations.length === 0) {
    return (
      <aside
        className="w-[476px] min-w-[476px] max-lg:w-full max-lg:min-w-full flex flex-col overflow-hidden border-r transition-colors duration-300"
        style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
      >
        <div className="px-5 flex items-center justify-between h-[72px]">
          <h2 className="text-[22px] font-bold m-0 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Chats</h2>
          <MobileMenu />
        </div>
        <SearchBar onSearch={setSearchQuery} />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center">
          <RiChat3Line size={48} className="mb-3 opacity-50" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-[15px] font-semibold m-0 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            No conversations yet
          </p>
          <p className="text-[13px] m-0" style={{ color: 'var(--color-text-secondary)' }}>
            Start a new chat to get going!
          </p>
        </div>
      </aside>
    );
  }

  const sortedConversations = [...conversations].sort((a, b) => {
    const aTime = a?.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt).getTime() : 0;
    const bTime = b?.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  }).filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = conv.members?.[0];
    if (!other) return false;
    const fullName = `${other.first_name || ""} ${other.last_name || ""}`.trim().toLowerCase();
    return fullName.includes(q) || (other.username || "").toLowerCase().includes(q);
  });

  return (
    <aside
      className="w-[476px] min-w-[476px] max-lg:w-full max-lg:min-w-full flex flex-col overflow-hidden border-r transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
    >
      <div className="px-5 flex items-center justify-between h-[72px]">
        <h2 className="text-[22px] font-bold m-0 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Chats</h2>
        <MobileMenu />
      </div>
      <SearchBar onSearch={setSearchQuery} />
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {sortedConversations.map((conv) => {
          const { name, username, avatar, initials } = getDisplayInfo(conv.members);
          const isActive = selectedConversation?.conversationId === conv.conversationId;
          const preview = getPreview(conv.latestMessage);
          const time = formatTime(conv.latestMessage?.createdAt);
          const isSelf = conv.latestMessage?.senderId === user?.id;

          return (
            <button
              key={conv.conversationId}
              className="flex items-center gap-3 w-full p-3 border-none rounded-xl text-left cursor-pointer transition-colors duration-150"
              style={{
                backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => setSelectedConversation(conv)}
              id={`conv-${conv.conversationId}`}
            >
              {/* Avatar */}
              <div className="relative w-11 h-11 min-w-11 rounded-full overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span
                    className="flex items-center justify-center w-full h-full text-[15px] font-bold text-white rounded-full"
                    style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))' }}
                  >
                    {initials}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {name}
                  </span>
                  <span
                    className="text-[11px] whitespace-nowrap shrink-0"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {time}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[13px] truncate flex-1 min-w-0"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {isSelf && (
                      <span className="font-medium" style={{ color: 'var(--color-accent-primary)' }}>
                        You:{" "}
                      </span>
                    )}
                    {preview}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full shrink-0"
                      style={{ backgroundColor: 'var(--color-unread-badge, var(--color-accent-primary))', color: 'var(--color-unread-badge-text, #fff)' }}
                    >
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default RecentChatsSideBar;
