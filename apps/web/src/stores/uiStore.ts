/**
 * @fileoverview UI state management store using Zustand.
 * Manages global UI state like modals, sidebars, and notifications.
 *
 * @module @plpg/web/stores/uiStore
 */

import { create } from 'zustand';

/**
 * Notification type for toast messages.
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

/**
 * UI store state interface.
 */
interface UIState {
  /** Whether the mobile sidebar is open */
  isSidebarOpen: boolean;
  /** Current active notifications */
  notifications: Notification[];
  /** Whether the app is in loading state */
  isLoading: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Generate a unique ID for notifications.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * UI store instance.
 * Manages global UI state across the application.
 *
 * @example
 * const { isSidebarOpen, toggleSidebar } = useUIStore();
 */
export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  notifications: [],
  isLoading: false,

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: generateId() },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
