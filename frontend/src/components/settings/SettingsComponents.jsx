import React from "react";
import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";

// A single row in the settings menu list.
export const SettingsRow = ({ icon: Icon, label, description, right, onClick, danger }) => (
  <button
    className={`flex items-center gap-3 w-full px-4 py-3 border-none bg-transparent text-left cursor-pointer transition-all duration-150 group ${danger ? "btn-danger-ghost" : "menu-item"}`}
    style={{ color: danger ? "#ef4444" : "var(--color-text-primary)" }}
    onClick={onClick}
    type="button"
  >
    <span
      className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200"
      style={{
        backgroundColor: danger ? "rgba(239, 68, 68, 0.08)" : "var(--color-border)",
        color: danger ? "#ef4444" : "var(--color-text-primary)",
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

// Uppercase section label.
export const SectionHeader = ({ title }) => (
  <div className="px-4 pt-5 pb-1.5">
    <p
      className="text-[11px] font-semibold uppercase tracking-wider m-0"
      style={{ color: "var(--color-text-primary)", opacity: 0.6 }}
    >
      {title}
    </p>
  </div>
);

// Horizontal divider line.
export const Divider = () => (
  <div className="mx-4 my-1">
    <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />
  </div>
);

// Colored banner for success/error feedback.
export const AlertBanner = ({ message, type }) => {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className="flex items-center gap-2 mx-4 mb-3 px-3 py-2.5 rounded-xl text-[13px] font-medium"
      role="alert"
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

// Password field with show/hide toggle.
export const PasswordInput = ({ label, value, onChange, show, onToggleShow, placeholder }) => (
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

// Single-line text input with label.
export const TextInput = ({ label, value, onChange, placeholder }) => (
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

// Header with back arrow + title for sub-views.
export const SubViewHeader = ({ title, onBack }) => (
  <div className="px-5 flex items-center gap-3 h-[72px] shrink-0">
    <button
      onClick={onBack}
      className="btn-ghost flex items-center justify-center w-9 h-9 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-105"
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
