import React, { useState } from "react";
import {
  RiArrowLeftLine,
  RiUserLine,
  RiShieldLine,
  RiPencilLine,
  RiCameraLine,
  RiDeleteBin6Line,
} from "react-icons/ri";
import { userStore } from "../../store/userStore";
import { getInitials } from "../../utils/getInitials";
import { SettingsRow, SectionHeader, Divider } from "./SettingsComponents";
import EditProfileView from "./EditProfileView";
import ChangePasswordView from "./ChangePasswordView";

const SettingsPanel = ({ onClose }) => {
  const { user } = userStore();
  const [activeView, setActiveView] = useState("main");

  // MAIN VIEW 
  if (activeView === "editProfile") {
    return (
      <aside
        className="w-[476px] min-w-[476px] max-lg:w-full max-lg:min-w-full flex flex-col overflow-hidden border-r transition-colors duration-300 h-screen"
        style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-border)" }}
      >
        <EditProfileView onBack={() => setActiveView("main")} />
      </aside>
    );
  }

  if (activeView === "changePassword") {
    return (
      <aside
        className="w-[476px] min-w-[476px] max-lg:w-full max-lg:min-w-full flex flex-col overflow-hidden border-r transition-colors duration-300 h-screen"
        style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-border)" }}
      >
        <ChangePasswordView onBack={() => setActiveView("main")} />
      </aside>
    );
  }

  return (
    <aside
      className="w-[476px] min-w-[476px] max-lg:w-full max-lg:min-w-full flex flex-col overflow-hidden border-r transition-colors duration-300 h-screen"
      style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-border)" }}
    >
      {/* Header */}
      <div className="px-5 flex items-center gap-3 h-[72px] shrink-0">
        <button
          onClick={onClose}
          className="btn-ghost flex items-center justify-center w-9 h-9 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105"
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
        {/* Profile Card */}
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
              onClick={() => setActiveView("editProfile")}
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
                backgroundColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              title="Edit profile"
              type="button"
            >
              <RiPencilLine size={18} />
            </button>
          </div>
        </div>

        {/* Account */}
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

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <SettingsRow
          icon={RiDeleteBin6Line}
          label="Delete Account"
          description="Permanently delete your account and data"
          danger
        />
      </div>
    </aside>
  );
};

export default SettingsPanel;
