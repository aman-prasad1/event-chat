import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RiSunLine, RiMoonLine, RiLogoutBoxRLine, RiUser3Line } from "react-icons/ri";
import { userStore } from "../store/userStore";
import { themeStore } from "../store/themeStore";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const { user, clearUser } = userStore();
  const { theme, toggleTheme } = themeStore();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {
      // user state is already cleared inside the hook
    } finally {
      setDropdownOpen(false);
      navigate("/login");
    }
  };

  // Generate initials from user data
  const getInitials = () => {
    if (!user) return "";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.username) return user.username[0].toUpperCase();
    return "U";
  };

  return (
    <nav
      className="sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-colors duration-300"
      style={{
        background: 'rgba(255,255,255,0.45)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[60px]">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline hover:opacity-85 transition-opacity">
          <span className="text-2xl leading-none">💬</span>
          <span
            className="text-xl font-bold tracking-tight bg-clip-text"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EventChat
          </span>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            id="theme-toggle"
            className="relative flex items-center justify-center w-10 h-10 border rounded-xl bg-transparent cursor-pointer overflow-hidden transition-all duration-250 hover:scale-105 active:scale-95"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
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

          {/* Auth section */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                id="profile-menu-btn"
                className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-transparent cursor-pointer overflow-hidden transition-all duration-250 hover:scale-105"
                style={{ borderColor: 'var(--color-border)' }}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="Open profile menu"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent-primary-light)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={`${user.username}'s profile`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span
                    className="flex items-center justify-center w-full h-full text-sm font-bold tracking-wide text-white rounded-full"
                    style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))' }}
                  >
                    {getInitials()}
                  </span>
                )}
                {/* Online indicator */}
                <span
                  className="absolute bottom-[1px] right-[1px] w-2.5 h-2.5 rounded-full bg-green-500 transition-colors duration-300"
                  style={{ borderWidth: '2px', borderColor: 'var(--color-primary)' }}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] min-w-[220px] rounded-xl overflow-hidden animate-dropdown-slide"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 15px -3px rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="px-4 py-3.5">
                    <p className="text-sm font-semibold m-0" style={{ color: 'var(--color-text-primary)' }}>
                      {user.first_name
                        ? `${user.first_name} ${user.last_name || ""}`
                        : user.username}
                    </p>
                    <p className="text-xs mt-0.5 m-0" style={{ color: 'var(--color-text-secondary)' }}>
                      @{user.username}
                    </p>
                  </div>
                  <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                  <button
                    id="logout-btn"
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm bg-transparent border-none cursor-pointer transition-all duration-150 hover:text-red-500"
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
          ) : (
            <Link
              to="/login"
              id="login-nav-btn"
              className="inline-flex items-center gap-2 px-4.5 py-2 text-sm font-semibold text-white rounded-lg no-underline transition-all duration-250 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))',
                boxShadow: '0 1px 3px rgba(79, 70, 229, 0.25)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.35)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(79, 70, 229, 0.25)'}
            >
              <RiUser3Line size={18} />
              <span className="max-[480px]:hidden">Log in</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
