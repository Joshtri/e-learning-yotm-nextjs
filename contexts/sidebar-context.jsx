"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext({
  isOpen: true,
  toggle: () => {},
});

export function SidebarProvider({ children }) {
  // Default to open on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile when component mounts
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkIfMobile();

    // Close sidebar by default on mobile
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }

    // Add resize listener
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
