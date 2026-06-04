import React, { useRef, useState } from "react";
import {
  RiSendPlane2Fill,
  RiAttachment2,
  RiImageLine,
  RiVideoLine,
  RiMusicLine,
  RiFilePdfLine,
  RiFileExcel2Line,
  RiFileWord2Line,
  RiFileZipLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import InputEmoji from "react-input-emoji";
import { formatFileSize } from "../../utils/formatters";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Returns an appropriate icon for the given file based on MIME type.
const getFileIcon = (file) => {
  const type = file.type;
  if (type.startsWith("image/")) return <RiImageLine size={14} />;
  if (type.startsWith("video/")) return <RiVideoLine size={14} />;
  if (type.startsWith("audio/")) return <RiMusicLine size={14} />;
  if (type === "application/pdf") return <RiFilePdfLine size={14} />;
  if (type.includes("spreadsheet") || type.includes("excel")) return <RiFileExcel2Line size={14} />;
  if (type.includes("document") || type.includes("word")) return <RiFileWord2Line size={14} />;
  if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return <RiFileZipLine size={14} />;
  return <RiAttachment2 size={14} />;
};

// Convert sanitized HTML from InputEmoji (which uses <br> for newlines)
// into plain text with newline characters before sending.
const htmlToPlain = (html) => {
  if (!html) return "";
  let s = html.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/?div>/gi, "\n");
  s = s.replace(/<[^>]*>/g, "");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s;
};

// Input bar with emoji picker, file selector, previews, and send button.
const ChatInput = ({ input, setInput, sending, onSend, inputRef }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileSizeWarning, setFileSizeWarning] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const valid = [];
    const rejected = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(file.name);
      } else {
        valid.push(file);
      }
    }

    if (rejected.length > 0) {
      setFileSizeWarning(
        `${rejected.join(", ")} ${rejected.length === 1 ? "exceeds" : "exceed"} the 10 MB limit`
      );
      setTimeout(() => setFileSizeWarning(""), 4000);
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
    e.target.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = (messageText = input) => {
    const text = messageText.trim();
    const hasFiles = selectedFiles.length > 0;
    if ((!text && !hasFiles) || sending) return;
    onSend(text, selectedFiles);
    setSelectedFiles([]);
  };

  return (
    <div
      className="shrink-0 px-4 py-3 border-t"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* File Size Warning */}
      {fileSizeWarning && (
        <div
          className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-xs font-medium animate-pulse"
          role="alert"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <RiErrorWarningLine size={16} />
          <span className="flex-1">{fileSizeWarning}</span>
          <button
            onClick={() => setFileSizeWarning("")}
            className="shrink-0 border-none bg-transparent cursor-pointer text-xs font-bold opacity-60 hover:opacity-100"
            style={{ color: '#ef4444' }}
          >
            <IoClose size={14} />
          </button>
        </div>
      )}

      {/* File Preview Strip */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg text-xs max-w-50 group transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <span className="text-sm">{getFileIcon(file)}</span>
              <span className="truncate flex-1 font-medium" title={file.name}>{file.name}</span>
              <span className="shrink-0 opacity-60" style={{ color: 'var(--color-text-secondary)' }}>
                {formatFileSize(file.size)}
              </span>
              <button
                onClick={() => removeFile(idx)}
                className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-150 ml-0.5"
                style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}
                title="Remove file"
              >
                <IoClose size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 border"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary)' }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}
          title="Attach files"
          type="button"
        >
          <RiAttachment2 size={22} />
        </button>

        <div className="flex-1 chatbox-emoji-input-shell">
          <InputEmoji
            ref={inputRef}
            value={input}
            onChange={setInput}
            onEnter={(html) => handleSend(htmlToPlain(html))}
            placeholder="Type a message..."
            cleanOnEnter={true}
            shouldReturn={true}
            height={44}
            borderRadius={12}
            borderColor="transparent"
            background="transparent"
            color="var(--color-text-primary)"
            placeholderColor="var(--color-text-secondary)"
            fontSize={14}
            fontFamily="var(--font-sans)"
            inputClass="chatbox-emoji-input"
            theme="auto"
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={(!input.trim() && selectedFiles.length === 0) || sending}
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-send-btn-bg)',
            color: 'var(--color-send-btn-text)',
          }}
          type="button"
        >
          <RiSendPlane2Fill size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
