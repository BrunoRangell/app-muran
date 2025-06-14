
import { useState, useEffect } from 'react';

interface SidebarState {
  favorites: string[];
  recentPages: string[];
  isCollapsed: boolean;
}

export const useSidebarState = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentPages, setRecentPages] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Carregar estado do localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("sidebar-favorites");
    const savedRecent = localStorage.getItem("sidebar-recent");
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    if (savedRecent) {
      setRecentPages(JSON.parse(savedRecent));
    }
    
    if (savedCollapsed) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Função para alternar favoritos
  const toggleFavorite = (url: string) => {
    const updatedFavorites = favorites.includes(url)
      ? favorites.filter(fav => fav !== url)
      : [...favorites, url];
    
    setFavorites(updatedFavorites);
    localStorage.setItem("sidebar-favorites", JSON.stringify(updatedFavorites));
  };

  // Função para adicionar página recente
  const addRecentPage = (url: string) => {
    const updatedRecent = [
      url,
      ...recentPages.filter(page => page !== url)
    ].slice(0, 5);
    
    setRecentPages(updatedRecent);
    localStorage.setItem("sidebar-recent", JSON.stringify(updatedRecent));
  };

  // Função para alternar colapso
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  return {
    favorites,
    recentPages,
    isCollapsed,
    toggleFavorite,
    addRecentPage,
    toggleCollapse,
  };
};
