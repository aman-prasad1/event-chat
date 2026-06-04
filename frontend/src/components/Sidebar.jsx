import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RiChat3Fill, RiUserAddLine, RiSettings4Line, RiLogoutBoxRLine, RiSunLine, RiMoonLine } from "react-icons/ri";
import { userStore } from "../store/userStore";
import { themeStore } from "../store/themeStore";
import { useAuth } from "../hooks/useAuth";
import { useClickOutside } from "../hooks/useClickOutside";
import { getInitials } from "../utils/getInitials";
import Avatar from "./common/Avatar";

const Sidebar = ({ showUserSearch, showSettings, onToggleUserSearch, onToggleSettings }) => {
  const { user, clearUser } = userStore();
  const { theme, toggleTheme } = themeStore();
  const { logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const navigate = useNavigate();

  // Close popup on outside click
  const accountCloseHandler = useCallback(() => setAccountOpen(false), []);
  useClickOutside(accountRef, accountCloseHandler);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {
      // user state is already cleared inside the hook
    } finally {
      setAccountOpen(false);
      navigate("/login");
    }
  };



  return (
    <div
      className="flex flex-col items-center justify-between py-4 w-[60px] min-w-[60px] h-screen border-r transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
    >
      {/* Top icons */}
      <div className="flex flex-col items-center gap-2">
        {/* Chat button */}
        <button
          className="flex items-center justify-center w-10 h-10 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: !showUserSearch ? 'var(--color-sidebar-active)' : 'transparent',
            color: !showUserSearch ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          }}
          onClick={() => { if (showUserSearch) onToggleUserSearch(); }}
          onMouseEnter={(e) => {
            if (showUserSearch) {
              e.currentTarget.style.backgroundColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (showUserSearch) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
          title="Chats"
          type="button"
        >
          <RiChat3Fill size={22} />
        </button>

        {/* New chat / Search users button */}
        <button
          className="flex items-center justify-center w-10 h-10 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: showUserSearch ? 'var(--color-sidebar-active)' : 'transparent',
            color: showUserSearch ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          }}
          onClick={onToggleUserSearch}
          onMouseEnter={(e) => {
            if (!showUserSearch) {
              e.currentTarget.style.backgroundColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showUserSearch) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
          title="New Chat"
          type="button"
        >
          <RiUserAddLine size={22} />
        </button>

        {/* Settings button */}
        <button
          className="flex items-center justify-center w-10 h-10 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: showSettings ? 'var(--color-sidebar-active)' : 'transparent',
            color: showSettings ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          }}
          onClick={onToggleSettings}
          onMouseEnter={(e) => {
            if (!showSettings) {
              e.currentTarget.style.backgroundColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showSettings) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
          title="Settings"
          type="button"
        >
          <RiSettings4Line size={22} />
        </button>

        {/* Theme toggle */}
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105 overflow-hidden"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary)',
          }}
          onClick={toggleTheme}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          type="button"
        >
          <span
            className="absolute flex items-center justify-center transition-all duration-350"
            style={{
              opacity: theme === "light" ? 1 : 0,
              transform: theme === "light" ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
            }}
          >
            <RiMoonLine size={20} />
          </span>
          <span
            className="absolute flex items-center justify-center transition-all duration-350"
            style={{
              opacity: theme === "dark" ? 1 : 0,
              transform: theme === "dark" ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
            }}
          >
            <RiSunLine size={20} />
          </span>
        </button>
      </div>

      {/* Bottom - Account */}
      <div className="relative" ref={accountRef}>
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-transparent cursor-pointer transition-all duration-200 hover:scale-105"
          style={{ borderColor: 'var(--color-border)' }}
          onClick={() => setAccountOpen((prev) => !prev)}
          title="Account"
          type="button"
        >
          <Avatar user={user} size={36} />
          {/* Online indicator */}
          <span
            className="absolute bottom-[1px] right-[1px] w-2.5 h-2.5 rounded-full bg-green-500"
            style={{ borderWidth: '2px', borderColor: 'var(--color-primary)' }}
          />
        </button>

        {/* Account popup */}
        {accountOpen && (
          <div
            className="absolute left-[calc(100%+8px)] bottom-0 min-w-[200px] rounded-xl overflow-hidden animate-dropdown-slide z-50"
            style={{
              backgroundColor: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 15px -3px rgba(0,0,0,0.08)',
            }}
          >
            {/* User info */}
            <div className="px-4 py-3">
              <p className="text-sm font-semibold m-0" style={{ color: 'var(--color-text-primary)' }}>
                {user?.first_name
                  ? `${user.first_name} ${user.last_name || ""}`
                  : user?.username}
              </p>
              <p className="text-xs mt-0.5 m-0" style={{ color: 'var(--color-text-secondary)' }}>
                @{user?.username}
              </p>
            </div>
            <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
            {/* Logout */}
            <button
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm bg-transparent border-none cursor-pointer transition-all duration-150"
              style={{ color: 'var(--color-text-secondary)' }}
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <RiLogoutBoxRLine size={16} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
