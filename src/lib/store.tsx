import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppNotification,
  AppSettings,
  ChatMessage,
  ChatThread,
  MaintenanceItem,
  UserProfile,
  Vehicle,
  VehicleDocument,
} from '@/types';
import {
  DEMO_CHAT_THREADS,
  DEMO_DOCUMENTS,
  DEMO_NOTIFICATIONS,
  DEMO_PROFILE,
  DEMO_RECORDS,
  DEMO_VEHICLES,
} from '@/data/mockData';
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from './storage';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'dark',
  notifications: {
    maintenance: true,
    documents: true,
    diagnostics: true,
    product: false,
    channels: { email: true, sms: false, push: true },
  },
  privacy: { shareWithMechanic: false, analytics: false, storeDocumentsLocally: true },
  vehicles: { defaultReminderKm: 500, mileageUnit: 'km' },
};

export type NewVehicleInput = Omit<Vehicle, 'id' | 'isPrimary' | 'verification' | 'averageMonthlyKm'> &
  Partial<Pick<Vehicle, 'isPrimary' | 'verification' | 'averageMonthlyKm'>>;

export type NewRecordInput = Omit<MaintenanceItem, 'id' | 'vehicleId'> &
  Partial<Pick<MaintenanceItem, 'vehicleId'>>;

interface AppContextValue {
  vehicles: Vehicle[];
  records: MaintenanceItem[];
  documents: VehicleDocument[];
  notifications: AppNotification[];
  chats: ChatThread[];
  profile: UserProfile;
  settings: AppSettings;
  primaryVehicleId: string;
  activeVehicle: Vehicle | undefined;
  isAuthenticated: boolean;
  setPrimaryVehicle: (id: string) => void;
  addVehicle: (input: NewVehicleInput) => Vehicle;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  addRecord: (input: NewRecordInput) => void;
  updateRecord: (id: string, patch: Partial<MaintenanceItem>) => void;
  addDocument: (doc: Omit<VehicleDocument, 'id'>) => void;
  deleteDocument: (id: string) => void;
  markNotificationRead: (id: string, read?: boolean) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  appendChatMessage: (threadId: string, message: ChatMessage) => void;
  createChatThread: (vehicleId: string) => ChatThread;
  clearChatThread: (threadId: string) => void;
  signIn: () => void;
  signOut: () => void;
  resetDemoData: () => void;
  recordsForVehicle: (vehicleId: string) => MaintenanceItem[];
  documentsForVehicle: (vehicleId: string) => VehicleDocument[];
}

const AppContext = createContext<AppContextValue | null>(null);

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const FALLBACK_IMAGES = [
  '/images/car-elantra.jpg',
  '/images/car-corolla.jpg',
  '/images/car-sportage.jpg',
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    readStorage<Vehicle[]>(STORAGE_KEYS.vehicles, DEMO_VEHICLES),
  );
  const [records, setRecords] = useState<MaintenanceItem[]>(() =>
    readStorage<MaintenanceItem[]>(STORAGE_KEYS.records, DEMO_RECORDS),
  );
  const [documents, setDocuments] = useState<VehicleDocument[]>(() =>
    readStorage<VehicleDocument[]>(STORAGE_KEYS.documents, DEMO_DOCUMENTS),
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    readStorage<AppNotification[]>(STORAGE_KEYS.notifications, DEMO_NOTIFICATIONS),
  );
  const [chats, setChats] = useState<ChatThread[]>(() =>
    readStorage<ChatThread[]>(STORAGE_KEYS.chats, DEMO_CHAT_THREADS),
  );
  const [profile, setProfile] = useState<UserProfile>(() =>
    readStorage<UserProfile>(STORAGE_KEYS.profile, DEMO_PROFILE),
  );
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = readStorage<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...stored.privacy },
      vehicles: { ...DEFAULT_SETTINGS.vehicles, ...stored.vehicles },
    };
  });
  const [primaryVehicleId, setPrimaryVehicleId] = useState<string>(() => {
    const stored = readStorage<string>(STORAGE_KEYS.primaryVehicle, '');
    if (stored) return stored;
    return DEMO_VEHICLES.find((v) => v.isPrimary)?.id ?? DEMO_VEHICLES[0]?.id ?? '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    readStorage<boolean>(STORAGE_KEYS.session, false),
  );

  useEffect(() => writeStorage(STORAGE_KEYS.vehicles, vehicles), [vehicles]);
  useEffect(() => writeStorage(STORAGE_KEYS.records, records), [records]);
  useEffect(() => writeStorage(STORAGE_KEYS.documents, documents), [documents]);
  useEffect(() => writeStorage(STORAGE_KEYS.notifications, notifications), [notifications]);
  useEffect(() => writeStorage(STORAGE_KEYS.chats, chats), [chats]);
  useEffect(() => writeStorage(STORAGE_KEYS.profile, profile), [profile]);
  useEffect(() => writeStorage(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => writeStorage(STORAGE_KEYS.primaryVehicle, primaryVehicleId), [primaryVehicleId]);
  useEffect(() => writeStorage(STORAGE_KEYS.session, isAuthenticated), [isAuthenticated]);

  // Keep the primary id valid if a vehicle gets deleted.
  useEffect(() => {
    if (vehicles.length === 0) return;
    if (!vehicles.some((v) => v.id === primaryVehicleId)) {
      setPrimaryVehicleId(vehicles[0].id);
    }
  }, [vehicles, primaryVehicleId]);

  const setPrimaryVehicle = useCallback((id: string) => {
    setPrimaryVehicleId(id);
    setVehicles((prev) => prev.map((v) => ({ ...v, isPrimary: v.id === id })));
  }, []);

  const addVehicle = useCallback((input: NewVehicleInput) => {
    const id = uid('veh');
    const vehicle: Vehicle = {
      ...input,
      id,
      isPrimary: input.isPrimary ?? false,
      verification: input.verification ?? 'owner_reported',
      averageMonthlyKm: input.averageMonthlyKm ?? 1200,
    };
    setVehicles((prev) => [...prev, vehicle]);
    setPrimaryVehicleId((prev) => prev || id);
    return vehicle;
  }, []);

  const updateVehicle = useCallback((id: string, patch: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setRecords((prev) => prev.filter((r) => r.vehicleId !== id));
    setDocuments((prev) => prev.filter((d) => d.vehicleId !== id));
    setChats((prev) => prev.filter((c) => c.vehicleId !== id));
    setNotifications((prev) => prev.filter((n) => n.vehicleId !== id));
  }, []);

  const addRecord = useCallback((input: NewRecordInput) => {
    setRecords((prev) => [
      { ...input, id: uid('rec'), vehicleId: input.vehicleId ?? primaryVehicleId } as MaintenanceItem,
      ...prev,
    ]);
  }, [primaryVehicleId]);

  const updateRecord = useCallback((id: string, patch: Partial<MaintenanceItem>) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const addDocument = useCallback((doc: Omit<VehicleDocument, 'id'>) => {
    setDocuments((prev) => [{ ...doc, id: uid('doc') }, ...prev]);
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string, read = true) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const appendChatMessage = useCallback((threadId: string, message: ChatMessage) => {
    setChats((prev) =>
      prev.map((thread) =>
        thread.id === threadId
          ? { ...thread, messages: [...thread.messages, message], updatedAt: message.createdAt }
          : thread,
      ),
    );
  }, []);

  const createChatThread = useCallback(
    (vehicleId: string) => {
      const thread: ChatThread = {
        id: uid('thread'),
        vehicleId,
        title: 'New conversation',
        titleAr: 'محادثة جديدة',
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      setChats((prev) => [thread, ...prev]);
      return thread;
    },
    [],
  );

  const clearChatThread = useCallback((threadId: string) => {
    setChats((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, messages: [] } : t)),
    );
  }, []);

  const signIn = useCallback(() => setIsAuthenticated(true), []);
  const signOut = useCallback(() => setIsAuthenticated(false), []);

  const resetDemoData = useCallback(() => {
    setVehicles(DEMO_VEHICLES);
    setRecords(DEMO_RECORDS);
    setDocuments(DEMO_DOCUMENTS);
    setNotifications(DEMO_NOTIFICATIONS);
    setChats(DEMO_CHAT_THREADS);
    setProfile(DEMO_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    setPrimaryVehicleId(DEMO_VEHICLES[0].id);
    Object.values(STORAGE_KEYS).forEach(removeStorage);
  }, []);

  const recordsForVehicle = useCallback(
    (vehicleId: string) =>
      records
        .filter((r) => r.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records],
  );

  const documentsForVehicle = useCallback(
    (vehicleId: string) => documents.filter((d) => d.vehicleId === vehicleId),
    [documents],
  );

  const activeVehicle = useMemo(
    () => vehicles.find((v) => v.id === primaryVehicleId) ?? vehicles[0],
    [vehicles, primaryVehicleId],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      vehicles,
      records,
      documents,
      notifications,
      chats,
      profile,
      settings,
      primaryVehicleId: activeVehicle?.id ?? '',
      activeVehicle,
      isAuthenticated,
      setPrimaryVehicle,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addRecord,
      updateRecord,
      addDocument,
      deleteDocument,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      updateSettings,
      updateProfile,
      appendChatMessage,
      createChatThread,
      clearChatThread,
      signIn,
      signOut,
      resetDemoData,
      recordsForVehicle,
      documentsForVehicle,
    }),
    [
      vehicles,
      records,
      documents,
      notifications,
      chats,
      profile,
      settings,
      activeVehicle,
      isAuthenticated,
      setPrimaryVehicle,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addRecord,
      updateRecord,
      addDocument,
      deleteDocument,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      updateSettings,
      updateProfile,
      appendChatMessage,
      createChatThread,
      clearChatThread,
      signIn,
      signOut,
      resetDemoData,
      recordsForVehicle,
      documentsForVehicle,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export function fallbackImageForIndex(index: number): string {
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

export { DEFAULT_SETTINGS };
