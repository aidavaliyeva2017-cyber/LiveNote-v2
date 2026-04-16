export const SUPABASE_TABLES = {
  USER_PROFILES: 'user_profiles',
  TASKS: 'tasks',
  ROUTINES: 'routines',
  REMINDERS: 'reminders',
  CATEGORIES: 'categories',
} as const;

import { Platform } from 'react-native';
// iOS Simulator + Web: 127.0.0.1 | Android Emulator: 10.0.2.2 (mapped to host)
const OLLAMA_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
export const OLLAMA_BASE_URL = `http://${OLLAMA_HOST}:11434`;
export const AI_MODEL = 'llama3';
export const AI_MAX_TOKENS = 1024;
export const API_TIMEOUT_MS = 10000;
