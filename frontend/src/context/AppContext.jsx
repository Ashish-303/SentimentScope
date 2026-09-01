import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // The processed result from the last upload
  const [uploadResult, setUploadResult] = useState(null);
  // Upload state machine: idle | uploading | processing | success | error
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState(null);
  // Currently selected review for the detail page
  const [selectedReview, setSelectedReview] = useState(null);
  // Session-based history (stored in localStorage, loaded on mount)
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ss_history') || '[]');
    } catch {
      return [];
    }
  });

  const saveHistory = useCallback((entry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 20); // Keep last 20
      try {
        localStorage.setItem('ss_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem('ss_history'); } catch {}
  }, []);

  const value = {
    uploadResult, setUploadResult,
    uploadStatus, setUploadStatus,
    uploadError, setUploadError,
    selectedReview, setSelectedReview,
    history, saveHistory, clearHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
