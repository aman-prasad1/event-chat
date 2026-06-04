import React, { useState } from "react";
import { RiDeleteBin6Line, RiLoader4Line } from "react-icons/ri";
import { useAuth } from "../../hooks/useAuth";
import { SubViewHeader, AlertBanner, PasswordInput } from "./SettingsComponents";
import { useNavigate } from "react-router-dom";

const DeleteAccountView = ({ onBack }) => {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const executeDelete = async () => {
    setError("");
    setSuccess("");
    setDeleting(true);

    try {
      await deleteAccount({ password });
      setSuccess("Account deleted successfully. Redirecting...");
      setPassword("");
      setIsConfirming(false);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
      setIsConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    setError("");
    setSuccess("");
    setPassword("");
    setShowPassword(false);
    setIsConfirming(false);
    onBack();
  };

  return (
    <>
      <SubViewHeader title="Delete Account" onBack={handleBack} />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-6">
        <AlertBanner message={error} type="error" />
        <AlertBanner message={success} type="success" />

        {/* Warning banner */}
        <div
          className="mb-6 p-4 rounded-xl text-sm"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#ef4444",
          }}
        >
          <h4 className="font-semibold m-0 mb-1 text-sm">Warning: This action is permanent</h4>
          <p className="m-0 leading-relaxed text-[13px] opacity-90">
            Deleting your account will permanently remove all your messages, profile settings, and account details. You will lose access immediately.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <PasswordInput
            label="Confirm Password"
            value={password}
            onChange={(val) => {
              setPassword(val);
              if (isConfirming) setIsConfirming(false);
            }}
            show={showPassword}
            onToggleShow={() => setShowPassword((p) => !p)}
            placeholder="Enter password to confirm"
          />
        </div>

        {isConfirming ? (
          <div
            className="p-4 rounded-xl border mb-6 flex flex-col gap-4 animate-dropdown-slide"
            style={{
              backgroundColor: "var(--color-chatbox-bg, var(--color-primary))",
              borderColor: "var(--color-border)",
            }}
          >
            <p className="text-sm font-medium m-0" style={{ color: "var(--color-text-primary)" }}>
              Are you absolutely sure? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirming(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-solid text-sm font-semibold cursor-pointer transition-all duration-250 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  backgroundColor: "transparent",
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-none text-sm font-semibold cursor-pointer transition-all duration-250 hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                }}
                type="button"
              >
                {deleting ? (
                  <RiLoader4Line size={18} className="animate-spin" />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!password) {
                setError("Password is required");
                return;
              }
              setError("");
              setIsConfirming(true);
            }}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-none cursor-pointer text-sm font-semibold transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: "#ef4444",
              color: "#fff",
            }}
            type="button"
          >
            <RiDeleteBin6Line size={18} />
            <span>Delete Account</span>
          </button>
        )}
      </div>
    </>
  );
};

export default DeleteAccountView;
