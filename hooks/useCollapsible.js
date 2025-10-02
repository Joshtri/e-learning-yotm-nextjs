import { useState, useEffect } from 'react';

export const useCollapsible = (defaultCollapsed = false, localStorageKey = null) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Load initial state from localStorage if provided
  useEffect(() => {
    if (localStorageKey) {
      const savedState = localStorage.getItem(localStorageKey);
      if (savedState !== null) {
        setIsCollapsed(savedState === 'true');
      }
    }
  }, [localStorageKey]);

  // Save state to localStorage
  useEffect(() => {
    if (localStorageKey) {
      localStorage.setItem(localStorageKey, isCollapsed.toString());
    }
  }, [isCollapsed, localStorageKey]);

  const toggle = () => setIsCollapsed(!isCollapsed);
  const expand = () => setIsCollapsed(false);
  const collapse = () => setIsCollapsed(true);

  return {
    isCollapsed,
    toggle,
    expand,
    collapse,
  };
};