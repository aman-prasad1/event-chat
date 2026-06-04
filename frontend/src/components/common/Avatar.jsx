import React from "react";
import { getInitials } from "../../utils/getInitials";

/**
 * Reusable avatar with image + initials fallback.
 *
 * @param {Object}  props
 * @param {Object}  props.user        - User object with avatar_url, first_name, last_name, username
 * @param {number}  [props.size=40]   - Diameter in px
 * @param {string}  [props.className] - Extra wrapper classes
 * @param {boolean} [props.gradient]  - Use accent gradient for fallback (default: true)
 */
const Avatar = ({ user, size = 40, className = "", gradient = true }) => {
  const fallbackBg = gradient
    ? "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))"
    : "var(--color-send-btn-bg)";

  // Scale font size relative to avatar size
  const fontSize = Math.max(10, Math.round(size * 0.32));

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {user?.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={`${user.username || "user"}'s avatar`}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span
          className="flex items-center justify-center w-full h-full font-bold text-white rounded-full"
          style={{ background: fallbackBg, fontSize }}
        >
          {getInitials(user)}
        </span>
      )}
    </div>
  );
};

export default Avatar;
