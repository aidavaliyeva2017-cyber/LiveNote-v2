import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Family, FamilyMember, SharedEvent } from '../types/family';
import * as familyService from '../services/familyService';

const FAMILY_ID_KEY = 'livenote_family_id';

interface FamilyContextValue {
  family: Family | null;
  members: FamilyMember[];
  sharedEvents: SharedEvent[];
  loading: boolean;
  createFamily: (name: string, memberEmail: string) => Promise<void>;
  joinFamily: (code: string, memberEmail: string) => Promise<void>;
  leaveFamily: (memberEmail: string) => Promise<void>;
  addSharedEvent: (event: Omit<SharedEvent, 'id' | 'familyId' | 'createdAt'>) => Promise<void>;
  updateSharedEvent: (id: string, patch: Partial<SharedEvent>) => Promise<void>;
  deleteSharedEvent: (id: string) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [sharedEvents, setSharedEvents] = useState<SharedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Bootstrap: restore family from AsyncStorage
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const familyId = await AsyncStorage.getItem(FAMILY_ID_KEY);
        if (familyId) {
          const [f, m, e] = await Promise.all([
            familyService.getFamilyById(familyId),
            familyService.getFamilyMembers(familyId),
            familyService.getSharedEvents(familyId),
          ]);
          if (f) {
            setFamily(f);
            setMembers(m);
            setSharedEvents(e);
          } else {
            // Family was deleted — clear stale id
            await AsyncStorage.removeItem(FAMILY_ID_KEY);
          }
        }
      } catch {
        // Supabase not reachable — silently continue with no family
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!family) return;
    const unsub = familyService.subscribeToFamily(
      family.id,
      setSharedEvents,
      setMembers,
    );
    return unsub;
  }, [family?.id]);

  const createFamily = useCallback(async (name: string, memberEmail: string) => {
    const f = await familyService.createFamily(name, memberEmail);
    await AsyncStorage.setItem(FAMILY_ID_KEY, f.id);
    const [m, e] = await Promise.all([
      familyService.getFamilyMembers(f.id),
      familyService.getSharedEvents(f.id),
    ]);
    setFamily(f);
    setMembers(m);
    setSharedEvents(e);
  }, []);

  const joinFamily = useCallback(async (code: string, memberEmail: string) => {
    const f = await familyService.joinFamilyByCode(code, memberEmail);
    await AsyncStorage.setItem(FAMILY_ID_KEY, f.id);
    const [m, e] = await Promise.all([
      familyService.getFamilyMembers(f.id),
      familyService.getSharedEvents(f.id),
    ]);
    setFamily(f);
    setMembers(m);
    setSharedEvents(e);
  }, []);

  const leaveFamily = useCallback(async (memberEmail: string) => {
    if (!family) return;
    await familyService.removeMember(family.id, memberEmail);
    await AsyncStorage.removeItem(FAMILY_ID_KEY);
    setFamily(null);
    setMembers([]);
    setSharedEvents([]);
  }, [family]);

  const addSharedEvent = useCallback(async (event: Omit<SharedEvent, 'id' | 'familyId' | 'createdAt'>) => {
    if (!family) return;
    const newEvent = await familyService.addSharedEvent(family.id, event);
    setSharedEvents(prev => [...prev, newEvent]);
  }, [family]);

  const updateSharedEvent = useCallback(async (id: string, patch: Partial<SharedEvent>) => {
    await familyService.updateSharedEvent(id, patch);
    setSharedEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const deleteSharedEvent = useCallback(async (id: string) => {
    await familyService.deleteSharedEvent(id);
    setSharedEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const value: FamilyContextValue = {
    family,
    members,
    sharedEvents,
    loading,
    createFamily,
    joinFamily,
    leaveFamily,
    addSharedEvent,
    updateSharedEvent,
    deleteSharedEvent,
  };

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
};

export const useFamily = () => {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
};
