
import { useState, useEffect } from "react";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

export const useSidebarCollapse = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isCollapsed));
    } catch (error) {
      console.warn("Não foi possível salvar o estado do sidebar:", error);
    }
  }, [isCollapsed]);

  return {
    isCollapsed,
    toggleCollapse,
  };
};
