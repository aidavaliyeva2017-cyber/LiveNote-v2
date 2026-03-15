import { XP_PER_LEVEL } from '../constants/gamification';

export function computeLevel(xpTotal: number): number {
  return Math.floor(xpTotal / XP_PER_LEVEL) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) * XP_PER_LEVEL;
}

export function progressToNextLevel(xpTotal: number): number {
  const level = computeLevel(xpTotal);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return (xpTotal - current) / (next - current);
}

export function xpToNextLevel(xpTotal: number): number {
  const level = computeLevel(xpTotal);
  return xpForLevel(level + 1) - xpTotal;
}
