import { useEffect } from "react";

/**
 * Calls `onClose` when a mousedown event occurs outside the given ref.
 *
 * @param {React.RefObject} ref
 * @param {() => void} onClose
 */
export const useClickOutside = (ref, onClose) => {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, onClose]);
};
