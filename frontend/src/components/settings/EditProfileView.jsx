import React, { useState, useRef } from "react";
import {
  RiCameraLine,
  RiCheckLine,
  RiLoader4Line,
} from "react-icons/ri";
import { userStore } from "../../store/userStore";
import { useAuth } from "../../hooks/useAuth";
import { getInitials } from "../../utils/getInitials";
import { SubViewHeader, AlertBanner, TextInput } from "./SettingsComponents";

const EditProfileView = ({ onBack }) => {
  const { user } = userStore();
  const { updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const avatarInputRef = useRef(null);

  // Avatar handling
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  // Submit
  const handleSave = async () => {
    setError("");
    setSuccess("");

    const nameChanged =
      firstName.trim() !== (user?.first_name || "") ||
      lastName.trim() !== (user?.last_name || "") ||
      username.trim() !== (user?.username || "");

    if (!nameChanged && !avatarFile) {
      setError("No changes to save");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setError("First name, last name, and username are required");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      if (firstName.trim() !== (user?.first_name || "")) formData.append("first_name", firstName.trim());
      if (lastName.trim() !== (user?.last_name || "")) formData.append("last_name", lastName.trim());
      if (username.trim() !== (user?.username || "")) formData.append("username", username.trim());
      if (avatarFile) formData.append("avatar", avatarFile);

      await updateProfile(formData);
      setSuccess("Profile updated successfully");
      setAvatarFile(null);
      setAvatarPreview(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setError("");
    setSuccess("");
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
    setUsername(user?.username || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    onBack();
  };

  return (
    <>
      <SubViewHeader title="Edit Profile" onBack={handleBack} />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-6">
        <AlertBanner message={error} type="error" />
        <AlertBanner message={success} type="success" />

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
                  style={{ backgroundColor: "var(--color-send-btn-bg)" }}
                >
                  {getInitials(user)}
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
            style={{ color: "var(--color-text-primary)" }}
            type="button"
          >
            Change photo
          </button>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4 mt-2">
          <TextInput label="First Name" value={firstName} onChange={setFirstName} placeholder="Enter first name" />
          <TextInput label="Last Name" value={lastName} onChange={setLastName} placeholder="Enter last name" />
          <TextInput label="Username" value={username} onChange={setUsername} placeholder="Enter username" />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full mt-6 px-4 py-3 rounded-xl border-none cursor-pointer text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-send-btn-bg)",
            color: "var(--color-send-btn-text)",
          }}
          type="button"
        >
          {saving ? (
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
};

export default EditProfileView;
