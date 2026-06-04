/**
 * Returns uppercase initials from a user object.
 *
 * Priority: first_name + last_name → username[0] → "U"
 *
 * @param {Object|null} user
 * @returns {string}
 */
export const getInitials = (user) => {
  if (!user) return "";
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  if (user.username) return user.username[0].toUpperCase();
  return "U";
};
