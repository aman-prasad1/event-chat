import React, { useState } from "react";
import { RiSearchLine, RiCloseLine } from "react-icons/ri";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) onSearch("");
  };

  return (
    <div className="px-4 pb-3">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors duration-200"
        style={{
          backgroundColor: 'var(--color-search-bg)',
        }}
      >
        <RiSearchLine
          size={16}
          className="shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
        />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search users..."
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
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
            }}
            type="button"
          >
            <RiCloseLine size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
