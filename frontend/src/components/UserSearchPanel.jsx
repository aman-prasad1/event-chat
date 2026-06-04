import React, { useState, useEffect, useRef, useCallback } from "react";
import { RiSearchLine, RiCloseLine, RiArrowLeftLine, RiUserAddLine, RiLoader4Line, RiUserSearchLine } from "react-icons/ri";
import { useChat } from "../hooks/useChat";
import { userStore } from "../store/userStore";
import { getInitials } from "../utils/getInitials";
import Avatar from "./common/Avatar";

const UserSearchPanel = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [creatingFor, setCreatingFor] = useState(null); // userId being created
  const [hasSearched, setHasSearched] = useState(false);
  const { searchUsers, createDirectConversation, getRecentConversations } = useChat();
  const { user } = userStore();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Auto-focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    (searchQuery) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!searchQuery.trim()) {
        setResults([]);
        setIsSearching(false);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const users = await searchUsers(searchQuery.trim());
          // Filter out current user from results
          const filtered = users.filter((u) => u.id !== user?.id);
          setResults(filtered);
          setHasSearched(true);
        } catch (error) {
          setResults([]);
          setHasSearched(true);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    [searchUsers, user?.id]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleCreateConversation = async (targetUser) => {
    if (creatingFor) return; // prevent double-clicks
    setCreatingFor(targetUser.id);
    try {
      await createDirectConversation(targetUser.id);
      // Refresh conversations list so the new one appears
      await getRecentConversations();
      onClose();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setCreatingFor(null);
    }
  };



  return (
    <aside
      className="w-[476px] min-w-[476px] max-lg:w-full max-lg:min-w-full flex flex-col overflow-hidden border-r transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
    >
      {/* Header with back button */}
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
          style={{ color: 'var(--color-text-primary)' }}
        >
          New Chat
        </h2>
      </div>

      {/* Search input */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors duration-200"
          style={{ backgroundColor: 'var(--color-search-bg)' }}
        >
          <RiSearchLine
            size={16}
            className="shrink-0"
            style={{ color: 'var(--color-text-secondary)' }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search by name or username…"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {query && (
            <button
              onClick={handleClear}
              className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-none cursor-pointer transition-opacity duration-150 hover:opacity-70"
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}
              type="button"
            >
              <RiCloseLine size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {/* Loading spinner */}
        {isSearching && (
          <div className="flex items-center justify-center py-10">
            <RiLoader4Line
              size={24}
              className="animate-spin"
              style={{ color: 'var(--color-accent-primary)' }}
            />
          </div>
        )}

        {/* Results list */}
        {!isSearching && results.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {results.map((u, index) => (
              <div
                key={u.id}
                className="flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 cursor-default group"
                style={{
                  animation: `fadeSlideIn 0.25s ease-out ${index * 0.04}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Avatar */}
                <Avatar user={u} size={44} />

                {/* User info */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username}
                  </span>
                  <span
                    className="text-[13px] truncate"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    @{u.username}
                  </span>
                </div>

                {/* Add conversation button */}
                <button
                  onClick={() => handleCreateConversation(u)}
                  disabled={creatingFor === u.id}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-110 shrink-0"
                  style={{
                    backgroundColor: creatingFor === u.id
                      ? 'var(--color-border)'
                      : 'var(--color-send-btn-bg)',
                    color: 'var(--color-send-btn-text)',
                    opacity: creatingFor === u.id ? 0.7 : 1,
                  }}
                  title={`Start conversation with ${u.username}`}
                  type="button"
                >
                  {creatingFor === u.id ? (
                    <RiLoader4Line size={18} className="animate-spin" />
                  ) : (
                    <RiUserAddLine size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state - no results */}
        {!isSearching && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
            <RiUserSearchLine
              size={48}
              className="mb-3 opacity-40"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <p
              className="text-[15px] font-semibold m-0 mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              No users found
            </p>
            <p
              className="text-[13px] m-0"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Try a different name or username
            </p>
          </div>
        )}

        {/* Initial state - no search yet */}
        {!isSearching && !hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
            <RiUserSearchLine
              size={48}
              className="mb-3 opacity-30"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <p
              className="text-[15px] font-semibold m-0 mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Find people
            </p>
            <p
              className="text-[13px] m-0"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Search by name or username to start a conversation
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default UserSearchPanel;
