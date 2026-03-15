import React, { createContext, useContext, useState, useCallback } from 'react';
import { GamificationState } from '../types/gamification';
import { computeLevel, progressToNextLevel, xpToNextLevel } from '../utils/xpUtils';

interface GamificationContextType extends GamificationState {
  addXP: (amount: number) => { leveledUp: boolean; newLevel: number };
  setXP: (total: number) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [xpTotal, setXPTotal] = useState(0);

  const addXP = useCallback((amount: number) => {
    let leveledUp = false;
    let newLevel = 0;
    setXPTotal((prev) => {
      const oldLevel = computeLevel(prev);
      const updated = prev + amount;
      newLevel = computeLevel(updated);
      leveledUp = newLevel > oldLevel;
      return updated;
    });
    return { leveledUp, newLevel };
  }, []);

  const setXP = useCallback((total: number) => setXPTotal(total), []);

  const level = computeLevel(xpTotal);

  return (
    <GamificationContext.Provider
      value={{
        xp_total: xpTotal,
        current_level: level,
        level_progress: progressToNextLevel(xpTotal),
        xp_to_next_level: xpToNextLevel(xpTotal),
        addXP,
        setXP,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
