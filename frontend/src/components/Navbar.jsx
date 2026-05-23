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
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo-icon">💬</span>
          <span className="navbar-logo-text">EventChat</span>
        </Link>

        {/* Right section */}
        <div className="navbar-actions">
          {/* Theme toggle */}
          <button
            id="theme-toggle"
            className="navbar-icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <span className={`theme-icon ${theme === "light" ? "icon-visible" : "icon-hidden"}`}>
              <RiMoonLine size={20} />
            </span>
            <span className={`theme-icon ${theme === "dark" ? "icon-visible" : "icon-hidden"}`}>
              <RiSunLine size={20} />
            </span>
          </button>

          {/* Auth section */}
          {user ? (
            <div className="navbar-profile" ref={dropdownRef}>
              <button
                id="profile-menu-btn"
                className="navbar-avatar-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="Open profile menu"
              >
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={`${user.username}'s profile`}
                    className="navbar-avatar-img"
                  />
                ) : (
                  <span className="navbar-avatar-fallback">{getInitials()}</span>
                )}
                {/* Online indicator */}
                <span className="navbar-online-dot" />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown-header">
                    <p className="navbar-dropdown-name">
                      {user.first_name
                        ? `${user.first_name} ${user.last_name || ""}`
                        : user.username}
                    </p>
                    <p className="navbar-dropdown-username">@{user.username}</p>
                  </div>
                  <div className="navbar-dropdown-divider" />
                  <button
                    id="logout-btn"
                    className="navbar-dropdown-item navbar-dropdown-item--danger"
                    onClick={handleLogout}
                  >
                    <RiLogoutBoxRLine size={16} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar-login-btn" id="login-nav-btn">
              <RiUser3Line size={18} />
              <span>Log in</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
