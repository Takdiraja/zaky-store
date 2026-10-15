import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id: string;
  type: "stock" | "debt" | "daily" | "sync";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markAllRead: () => void;
  clear: () => void;
  unreadCount: () => number;
}

let seq = 0;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (n) => {
        const id = `${Date.now()}-${seq++}`;
        set((s) => ({
          notifications: [
            { ...n, id, createdAt: new Date().toISOString(), read: false },
            ...s.notifications,
          ].slice(0, 30), // keep the latest 30
        }));
      },

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      clear: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: "app-notifications",
    },
  ),
);
