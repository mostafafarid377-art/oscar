import { asset } from '@/utils/asset';
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
import {
  resolveDataSource,
  visibleForSource,
  visibleNotificationsForSource,
} from './dataSeparation';
import { useAuth } from '@/features/auth/AuthProvider';
import { IS_BACKEND_CONNECTED } from '@/lib/supabase';
import {
  useCreateVehicle,
  useDeleteVehicle,
  useSetPrimaryVehicle,
  useUpdateVehicle,
  useVehicles,
} from '@/features/vehicles/api/useVehicles';

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

export type DataSource = 'live' | 'demo';

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
  /** 'live' → Supabase, 'demo' → local sample data. Never mixed. */
  dataSource: DataSource;
  /** True when Supabase credentials exist, so live mode is even possible. */
  liveAvailable: boolean;
  vehicleLoading: boolean;
  vehicleError: string | null;
  setDataSource: (source: DataSource) => void;
  setPrimaryVehicle: (id: string) => Promise<void> | void;
  addVehicle: (input: NewVehicleInput) => Promise<Vehicle>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void> | void;
  deleteVehicle: (id: string) => Promise<void> | void;
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
  asset('/images/car-elantra.jpg'),
  asset('/images/car-corolla.jpg'),
  asset('/images/car-sportage.jpg'),
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [demoVehicles, setDemoVehicles] = useState<Vehicle[]>(() =>
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
  const [demoAuthenticated, setDemoAuthenticated] = useState<boolean>(() =>
    readStorage<boolean>(STORAGE_KEYS.session, false),
  );

  // ---------------------------------------------------------------------
  // Phase 1 — dual data source
  // ---------------------------------------------------------------------
  const auth = useAuth();
  const liveVehicles = useVehicles();
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();
  const setPrimaryMutation = useSetPrimaryVehicle();

  const liveAvailable = IS_BACKEND_CONNECTED;
  const isLiveSession = liveAvailable && auth.status === 'signed_in';

  // Default: live whenever a real session exists, otherwise demo.
  const [dataSourcePreference, setDataSourcePreference] = useState<DataSource>(() =>
    readStorage<DataSource>(STORAGE_KEYS.dataSource, IS_BACKEND_CONNECTED ? 'live' : 'demo'),
  );

  const dataSource: DataSource = resolveDataSource({
    liveAvailable,
    signedIn: isLiveSession,
    preference: dataSourcePreference,
  });

  const setDataSource = useCallback((source: DataSource) => {
    setDataSourcePreference(source);
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.dataSource, dataSourcePreference);
  }, [dataSourcePreference]);

  // Signed out of a live session → fall back to demo so the screens still work.
  useEffect(() => {
    if (!isLiveSession && dataSourcePreference === 'live' && !liveAvailable) {
      setDataSourcePreference('demo');
    }
  }, [isLiveSession, dataSourcePreference, liveAvailable]);

  const liveVehicleIds = useMemo(
    () => new Set(liveVehicles.vehicles.map((v) => v.id)),
    [liveVehicles.vehicles],
  );

  useEffect(() => writeStorage(STORAGE_KEYS.vehicles, demoVehicles), [demoVehicles]);
  useEffect(() => writeStorage(STORAGE_KEYS.records, records), [records]);
  useEffect(() => writeStorage(STORAGE_KEYS.documents, documents), [documents]);
  useEffect(() => writeStorage(STORAGE_KEYS.notifications, notifications), [notifications]);
  useEffect(() => writeStorage(STORAGE_KEYS.chats, chats), [chats]);
  useEffect(() => writeStorage(STORAGE_KEYS.profile, profile), [profile]);
  useEffect(() => writeStorage(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => writeStorage(STORAGE_KEYS.primaryVehicle, primaryVehicleId), [primaryVehicleId]);
  useEffect(() => writeStorage(STORAGE_KEYS.session, demoAuthenticated), [demoAuthenticated]);

  // Keep the primary id valid if a demo vehicle gets deleted.
  useEffect(() => {
    if (demoVehicles.length === 0) return;
    if (!demoVehicles.some((v) => v.id === primaryVehicleId)) {
      setPrimaryVehicleId(demoVehicles[0].id);
    }
  }, [demoVehicles, primaryVehicleId]);

  const setPrimaryVehicle = useCallback(
    async (id: string) => {
      if (dataSource === 'live') {
        await setPrimaryMutation.mutateAsync(id);
        return;
      }
      setPrimaryVehicleId(id);
      setDemoVehicles((prev) => prev.map((v) => ({ ...v, isPrimary: v.id === id })));
    },
    [dataSource, setPrimaryMutation],
  );

  const addVehicle = useCallback(
    async (input: NewVehicleInput): Promise<Vehicle> => {
      if (dataSource === 'live') {
        const row = await createVehicleMutation.mutateAsync({
          make: input.make,
          model: input.model,
          year: input.year,
          trim: input.trim,
          mileage: input.mileage,
          transmission: input.transmission,
          fuelType: input.fuelType,
          licensePlate: input.plate,
          vin: input.vin,
        });
        // Return the persisted shape so callers can use the real UUID.
        return {
          ...input,
          id: row.id,
          isPrimary: row.is_primary,
          verification: 'owner_reported',
          averageMonthlyKm: 0,
        };
      }

      const id = uid('veh');
      const vehicle: Vehicle = {
        ...input,
        id,
        isPrimary: input.isPrimary ?? false,
        verification: input.verification ?? 'owner_reported',
        averageMonthlyKm: input.averageMonthlyKm ?? 1200,
      };
      setDemoVehicles((prev) => [...prev, vehicle]);
      setPrimaryVehicleId((prev) => prev || id);
      return vehicle;
    },
    [dataSource, createVehicleMutation],
  );

  const updateVehicle = useCallback(
    async (id: string, patch: Partial<Vehicle>) => {
      if (dataSource === 'live') {
        // Only send columns a real vehicle actually has.
        await updateVehicleMutation.mutateAsync({
          id,
          input: {
            make: patch.make ?? '',
            model: patch.model ?? '',
            year: patch.year ?? new Date().getFullYear(),
            trim: patch.trim,
            mileage: patch.mileage ?? 0,
            transmission: patch.transmission,
            fuelType: patch.fuelType,
            licensePlate: patch.plate,
            vin: patch.vin,
          },
        });
        return;
      }
      setDemoVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    },
    [dataSource, updateVehicleMutation],
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      if (dataSource === 'live') {
        await deleteVehicleMutation.mutateAsync(id);
        return;
      }
      setDemoVehicles((prev) => prev.filter((v) => v.id !== id));
      setRecords((prev) => prev.filter((r) => r.vehicleId !== id));
      setDocuments((prev) => prev.filter((d) => d.vehicleId !== id));
      setChats((prev) => prev.filter((c) => c.vehicleId !== id));
      setNotifications((prev) => prev.filter((n) => n.vehicleId !== id));
    },
    [dataSource, deleteVehicleMutation],
  );

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

  /** Demo-mode only. Real sign-in goes through useAuth(). */
  const signIn = useCallback(() => setDemoAuthenticated(true), []);

  const signOut = useCallback(() => {
    if (isLiveSession) {
      void auth.signOut();
    }
    setDemoAuthenticated(false);
    setDataSourcePreference('demo');
  }, [auth, isLiveSession]);

  const resetDemoData = useCallback(() => {
    setDemoVehicles(DEMO_VEHICLES);
    setRecords(DEMO_RECORDS);
    setDocuments(DEMO_DOCUMENTS);
    setNotifications(DEMO_NOTIFICATIONS);
    setChats(DEMO_CHAT_THREADS);
    setProfile(DEMO_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    setPrimaryVehicleId(DEMO_VEHICLES[0].id);
    Object.values(STORAGE_KEYS).forEach(removeStorage);
  }, []);

  // ---------------------------------------------------------------------
  // Demo / production separation
  // ---------------------------------------------------------------------
  // In live mode a vehicle that came from Supabase has no local records. If we
  // returned the unfiltered demo arrays, CarProof and Maintenance would happily
  // show the Elantra's oil changes as if they belonged to a user's brand-new
  // car. These "visible" arrays only ever contain rows whose vehicle is real.
  const visibleRecords = useMemo(
    () => visibleForSource(records, dataSource, liveVehicleIds),
    [dataSource, records, liveVehicleIds],
  );

  const visibleDocuments = useMemo(
    () => visibleForSource(documents, dataSource, liveVehicleIds),
    [dataSource, documents, liveVehicleIds],
  );

  const visibleNotifications = useMemo(
    () => visibleNotificationsForSource(notifications, dataSource, liveVehicleIds),
    [dataSource, notifications, liveVehicleIds],
  );

  const recordsForVehicle = useCallback(
    (vehicleId: string) =>
      visibleRecords
        .filter((r) => r.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [visibleRecords],
  );

  const documentsForVehicle = useCallback(
    (vehicleId: string) => visibleDocuments.filter((d) => d.vehicleId === vehicleId),
    [visibleDocuments],
  );

  // The vehicle list itself: live rows in live mode, demo rows otherwise.
  const vehicles = useMemo<Vehicle[]>(
    () => (dataSource === 'live' ? liveVehicles.vehicles : demoVehicles),
    [dataSource, liveVehicles.vehicles, demoVehicles],
  );

  const activeVehicle = useMemo(() => {
    if (vehicles.length === 0) return undefined;
    const primary = vehicles.find((v) => v.isPrimary);
    return primary ?? vehicles.find((v) => v.id === primaryVehicleId) ?? vehicles[0];
  }, [vehicles, primaryVehicleId]);

  const value = useMemo<AppContextValue>(
    () => ({
      vehicles,
      records: visibleRecords,
      documents: visibleDocuments,
      notifications: visibleNotifications,
      chats,
      profile,
      settings,
      primaryVehicleId: activeVehicle?.id ?? '',
      activeVehicle,
      isAuthenticated: isLiveSession || demoAuthenticated,
      dataSource,
      liveAvailable,
      vehicleLoading: liveVehicles.isLoading,
      vehicleError: liveVehicles.error?.message ?? null,
      setDataSource,
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
      visibleRecords,
      visibleDocuments,
      visibleNotifications,
      chats,
      profile,
      settings,
      activeVehicle,
      isLiveSession,
      demoAuthenticated,
      dataSource,
      liveAvailable,
      liveVehicles.isLoading,
      liveVehicles.error,
      setDataSource,
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
