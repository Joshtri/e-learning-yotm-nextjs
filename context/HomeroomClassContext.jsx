"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/axios";

// Safe defaults so useHomeroomClass() works outside the provider (e.g. tutor layout)
const defaultContext = {
  classes: [],
  selectedClass: null,
  selectedClassId: null,
  selectClass: () => {},
  isLoading: false,
  needsSelection: false,
};

const HomeroomClassContext = createContext(defaultContext);

export function HomeroomClassProvider({ children }) {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/homeroom/my-homeroom-classes");
        const classList = res.data.data || [];
        setClasses(classList);

        // Restore from localStorage if the saved class is still valid
        const stored = localStorage.getItem("selectedHomeroomClassId");
        const isValid = classList.some((c) => c.id === stored);

        if (isValid) {
          setSelectedClassId(stored);
        } else if (classList.length === 1) {
          // Auto-select when only one class — no dialog needed
          const autoId = classList[0].id;
          setSelectedClassId(autoId);
          localStorage.setItem("selectedHomeroomClassId", autoId);
        }
        // If classList.length > 1 and no valid stored → needsSelection = true → dialog shown
      } catch (err) {
        console.error("[HomeroomClassContext] Failed to fetch classes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const selectClass = (classId) => {
    setSelectedClassId(classId);
    localStorage.setItem("selectedHomeroomClassId", classId);
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  // True when: loaded, has multiple classes, but none selected yet
  const needsSelection = !isLoading && classes.length > 1 && !selectedClassId;

  return (
    <HomeroomClassContext.Provider
      value={{
        classes,
        selectedClass,
        selectedClassId,
        selectClass,
        isLoading,
        needsSelection,
      }}
    >
      {children}
    </HomeroomClassContext.Provider>
  );
}

export const useHomeroomClass = () => useContext(HomeroomClassContext);
