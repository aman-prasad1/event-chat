import React, { useState } from "react";
import { RiCheckLine, RiLoader4Line } from "react-icons/ri";
import { useAuth } from "../../hooks/useAuth";
import { SubViewHeader, AlertBanner, PasswordInput } from "./SettingsComponents";

const ChangePasswordView = ({ onBack }) => {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);

    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    onBack();
  };

  return (
    <>
      <SubViewHeader title="Change Password" onBack={handleBack} />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-6">
        <AlertBanner message={error} type="error" />
        <AlertBanner message={success} type="success" />

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
};

export default ChangePasswordView;
