import React, { useState, useRef } from "react";
import {
  RiArrowLeftLine,
  RiUserLine,
  RiShieldLine,
  RiPencilLine,
  RiCameraLine,
  RiArrowRightSLine,
  RiDeleteBin6Line,
  RiCheckLine,
  RiLoader4Line,
  RiEyeLine,
  RiEyeOffLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import { userStore } from "../store/userStore";
import { useAuth } from "../hooks/useAuth";

// ─── Extracted sub-components (defined outside to prevent remount on parent re-render) ───

const SettingsRow = ({ icon: Icon, label, description, right, onClick, danger }) => (
  <button
    className="flex items-center gap-3 w-full px-4 py-3 border-none bg-transparent text-left cursor-pointer transition-all duration-150 group"
    style={{ color: danger ? "#ef4444" : "var(--color-text-primary)" }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = danger
        ? "rgba(239, 68, 68, 0.06)"
        : "var(--color-border)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "transparent";
    }}
    type="button"
  >
    <span
      className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200"
      style={{
        backgroundColor: danger ? "rgba(239, 68, 68, 0.08)" : "var(--color-sidebar-active)",
        color: danger ? "#ef4444" : "var(--color-accent-primary)",
      }}
    >
      <Icon size={18} />
    </span>
    <div className="flex-1 min-w-0">
      <p
        className="text-sm font-medium m-0 truncate"
        style={{ color: danger ? "#ef4444" : "var(--color-text-primary)" }}
      >
        {label}
      </p>
      {description && (
        <p
          className="text-[12px] m-0 mt-0.5 truncate"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </p>
      )}
    </div>
    {right || (
      <RiArrowRightSLine
        size={18}
        className="shrink-0 opacity-40 group-hover:opacity-70 transition-opacity duration-150"
        style={{ color: "var(--color-text-secondary)" }}
      />
    )}
  </button>
);

const SectionHeader = ({ title }) => (
  <div className="px-4 pt-5 pb-1.5">
    <p
      className="text-[11px] font-semibold uppercase tracking-wider m-0"
      style={{ color: "var(--color-accent-primary)", opacity: 0.8 }}
    >
      {title}
    </p>
  </div>
);

const Divider = () => (
  <div className="mx-4 my-1">
    <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />
  </div>
);

const AlertBanner = ({ message, type }) => {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className="flex items-center gap-2 mx-4 mb-3 px-3 py-2.5 rounded-xl text-[13px] font-medium"
      style={{
        backgroundColor: isError ? "rgba(239, 68, 68, 0.08)" : "rgba(34, 197, 94, 0.08)",
        color: isError ? "#ef4444" : "#22c55e",
        border: `1px solid ${isError ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)"}`,
      }}
    >
      {isError ? <RiErrorWarningLine size={16} className="shrink-0" /> : <RiCheckLine size={16} className="shrink-0" />}
      <span className="flex-1">{message}</span>
    </div>
  );
};

const PasswordInput = ({ label, value, onChange, show, onToggleShow, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
      {label}
    </label>
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors duration-200"
      style={{ backgroundColor: "var(--color-search-bg)" }}
    >
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-sm"
        style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
      />
      <button
        onClick={onToggleShow}
        className="shrink-0 flex items-center justify-center border-none bg-transparent cursor-pointer transition-opacity duration-150 hover:opacity-70"
        style={{ color: "var(--color-text-secondary)" }}
        type="button"
      >
        {show ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
      </button>
    </div>
  </div>
);

const TextInput = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
      {label}
    </label>
    <div
      className="flex items-center px-3 py-2.5 rounded-xl transition-colors duration-200"
      style={{ backgroundColor: "var(--color-search-bg)" }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-sm"
        style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
      />
    </div>
  </div>
);

const SubViewHeader = ({ title, onBack }) => (
  <div className="px-5 flex items-center gap-3 h-[72px] shrink-0">
    <button
      onClick={onBack}
      className="flex items-center justify-center w-9 h-9 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105"
      style={{ backgroundColor: "transparent", color: "var(--color-text-secondary)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-border)";
        e.currentTarget.style.color = "var(--color-text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "var(--color-text-secondary)";
      }}
      type="button"
    >
      <RiArrowLeftLine size={20} />
    </button>
    <h2
      className="text-[22px] font-bold m-0 tracking-tight"
      style={{ color: "var(--color-text-primary)" }}
    >
      {title}
    </h2>
  </div>
);

// Sub-views: "main" | "editProfile" | "changePassword"
const SettingsPanel = ({ onClose }) => {
  const { user } = userStore();
  const { updateProfile, changePassword } = useAuth();
  const [activeView, setActiveView] = useState("main");

  // ─── Edit Profile state ───
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const avatarInputRef = useRef(null);

  // ─── Change Password state ───
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const getInitials = () => {
    if (!user) return "";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.username) return user.username[0].toUpperCase();
    return "U";
  };

  // ─── Avatar handling ───
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setProfileError("Please select an image file");
      return;
    }
    // 5MB limit for avatars
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image must be under 5 MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setProfileError("");
  };

  // ─── Update Profile ───
  const handleUpdateProfile = async () => {
    setProfileError("");
    setProfileSuccess("");

    // Validate at least one change
    const nameChanged = firstName.trim() !== (user?.first_name || "") ||
      lastName.trim() !== (user?.last_name || "") ||
      username.trim() !== (user?.username || "");

    if (!nameChanged && !avatarFile) {
      setProfileError("No changes to save");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setProfileError("First name, last name, and username are required");
      return;
    }

    setProfileSaving(true);

    try {
      const formData = new FormData();
      if (firstName.trim() !== (user?.first_name || "")) {
        formData.append("first_name", firstName.trim());
      }
      if (lastName.trim() !== (user?.last_name || "")) {
        formData.append("last_name", lastName.trim());
      }
      if (username.trim() !== (user?.username || "")) {
        formData.append("username", username.trim());
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await updateProfile(formData);
      setProfileSuccess("Profile updated successfully");
      setAvatarFile(null);
      setAvatarPreview(null);

      // Clear success after 3s
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // ─── Change Password ───
  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordSaving(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setPasswordSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Failed to change password"
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // ─── EDIT PROFILE VIEW ───
  const renderEditProfile = () => (
    <>
      <SubViewHeader
        title="Edit Profile"
        onBack={() => {
          setActiveView("main");
          setProfileError("");
          setProfileSuccess("");
          // Reset form to current user data
          setFirstName(user?.first_name || "");
          setLastName(user?.last_name || "");
          setUsername(user?.username || "");
          setAvatarFile(null);
          setAvatarPreview(null);
        }}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-6">
        <AlertBanner message={profileError} type="error" />
        <AlertBanner message={profileSuccess} type="success" />

        {/* Avatar section */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover rounded-full" />
              ) : user?.avatar_url ? (
                <img src={user.avatar_url} alt={`${user.username}'s profile`} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span
                  className="flex items-center justify-center w-full h-full text-2xl font-bold text-white rounded-full"
                  style={{ background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))" }}
                >
                  {getInitials()}
                </span>
              )}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            >
              <RiCameraLine size={24} className="text-white" />
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarSelect}
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="text-[13px] font-medium border-none bg-transparent cursor-pointer transition-opacity duration-150 hover:opacity-70"
            style={{ color: "var(--color-accent-primary)" }}
            type="button"
          >
            Change photo
          </button>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4 mt-2">
          <TextInput
            label="First Name"
            value={firstName}
            onChange={setFirstName}
            placeholder="Enter first name"
          />
          <TextInput
            label="Last Name"
            value={lastName}
            onChange={setLastName}
            placeholder="Enter last name"
          />
          <TextInput
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="Enter username"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleUpdateProfile}
          disabled={profileSaving}
          className="flex items-center justify-center gap-2 w-full mt-6 px-4 py-3 rounded-xl border-none cursor-pointer text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-accent-primary)",
            color: "#fff",
          }}
          type="button"
        >
          {profileSaving ? (
            <>
              <RiLoader4Line size={18} className="animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <RiCheckLine size={18} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  // ─── CHANGE PASSWORD VIEW ───
  const renderChangePassword = () => (
    <>
      <SubViewHeader
        title="Change Password"
        onBack={() => {
          setActiveView("main");
          setPasswordError("");
          setPasswordSuccess("");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setShowCurrentPw(false);
          setShowNewPw(false);
          setShowConfirmPw(false);
        }}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-6">
        <AlertBanner message={passwordError} type="error" />
        <AlertBanner message={passwordSuccess} type="success" />

        <div className="flex flex-col gap-4 mt-2">
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrentPw}
            onToggleShow={() => setShowCurrentPw((p) => !p)}
            placeholder="Enter current password"
          />
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNewPw}
            onToggleShow={() => setShowNewPw((p) => !p)}
            placeholder="At least 6 characters"
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            show={showConfirmPw}
            onToggleShow={() => setShowConfirmPw((p) => !p)}
            placeholder="Re-enter new password"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleChangePassword}
          disabled={passwordSaving}
          className="flex items-center justify-center gap-2 w-full mt-6 px-4 py-3 rounded-xl border-none cursor-pointer text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-accent-primary)",
            color: "#fff",
          }}
          type="button"
        >
          {passwordSaving ? (
            <>
              <RiLoader4Line size={18} className="animate-spin" />
              <span>Updating…</span>
            </>
          ) : (
            <>
              <RiCheckLine size={18} />
              <span>Update Password</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  // ─── MAIN VIEW ───
  const renderMain = () => (
    <>
      {/* Header */}
      <div className="px-5 flex items-center gap-3 h-[72px] shrink-0">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: "transparent", color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
          title="Back to chats"
          type="button"
        >
          <RiArrowLeftLine size={20} />
        </button>
        <h2
          className="text-[22px] font-bold m-0 tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Settings
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pb-6">
        {/* ─── Profile Card ─── */}
        <div
          className="mx-4 mt-2 mb-3 p-4 rounded-2xl"
          style={{
            backgroundColor: "var(--color-chatbox-bg, var(--color-primary))",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar with camera overlay */}
            <div
              className="relative group cursor-pointer"
              onClick={() => {
                setActiveView("editProfile");
              }}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.username}'s profile`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span
                    className="flex items-center justify-center w-full h-full text-lg font-bold text-white rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-lighter))",
                    }}
                  >
                    {getInitials()}
                  </span>
                )}
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
              >
                <RiCameraLine size={20} className="text-white" />
              </div>
            </div>
            {/* User info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-base font-semibold m-0 truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {user?.first_name
                  ? `${user.first_name} ${user.last_name || ""}`
                  : user?.username || "User"}
              </p>
              <p
                className="text-[13px] m-0 mt-0.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                @{user?.username || "username"}
              </p>
            </div>
            {/* Edit profile button */}
            <button
              onClick={() => setActiveView("editProfile")}
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: "var(--color-sidebar-active)",
                color: "var(--color-accent-primary)",
              }}
              title="Edit profile"
              type="button"
            >
              <RiPencilLine size={18} />
            </button>
          </div>
        </div>

        {/* ─── Account ─── */}
        <SectionHeader title="Account" />
        <SettingsRow
          icon={RiUserLine}
          label="Edit Profile"
          description="Name, username, avatar"
          onClick={() => setActiveView("editProfile")}
        />
        <SettingsRow
          icon={RiShieldLine}
          label="Change Password"
          description="Update your password"
          onClick={() => setActiveView("changePassword")}
        />

        <Divider />

        {/* ─── Danger Zone ─── */}
        <SectionHeader title="Danger Zone" />
        <SettingsRow
          icon={RiDeleteBin6Line}
          label="Delete Account"
          description="Permanently delete your account and data"
          danger
        />
      </div>
    </>
  );

  return (
    <aside
      className="w-[476px] min-w-[476px] max-lg:w-full max-lg:min-w-full flex flex-col overflow-hidden border-r transition-colors duration-300 h-screen"
      style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-border)" }}
    >
      {activeView === "editProfile" && renderEditProfile()}
      {activeView === "changePassword" && renderChangePassword()}
      {activeView === "main" && renderMain()}
    </aside>
  );
};

export default SettingsPanel;
