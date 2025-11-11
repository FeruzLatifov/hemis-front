/**
 * Menu Store - Zustand
 * Dinamik menu state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuSection } from '../types/menu.types';
import { MENU_CONFIG, filterMenuByPermissions } from '../constants/menu-config';

interface MenuStore {
  // State
  sections: MenuSection[];
  loading: boolean;
  error: string | null;
  collapsed: boolean;                    // Sidebar collapsed
  expandedMenus: string[];               // Expanded menu IDs
  userPermissions: string[];

  // Actions
  loadMenu: (permissions?: string[]) => void;
  toggleSidebar: () => void;
  toggleMenu: (menuId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  setPermissions: (permissions: string[]) => void;
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sections: MENU_CONFIG,
      loading: false,
      error: null,
      collapsed: false,
      expandedMenus: [],
      userPermissions: [],

      // Load menu (Backend'dan yoki static config'dan)
      loadMenu: (permissions = []) => {
        set({ loading: true, error: null });

        try {
          let sections = MENU_CONFIG;

          // Agar permissions bor bo'lsa, filter qilish
          if (permissions.length > 0) {
            sections = filterMenuByPermissions(MENU_CONFIG, permissions);
          }

          set({
            sections,
            userPermissions: permissions,
            loading: false,
          });
        } catch (error: unknown) {
          set({
            error: error instanceof Error ? error.message : 'Menu yuklanmadi',
            loading: false,
          });
        }
      },

      // Sidebar toggle
      toggleSidebar: () => {
        set((state) => ({
          collapsed: !state.collapsed,
          // Collapsed bo'lganda hamma menu'larni yopish
          expandedMenus: !state.collapsed ? [] : state.expandedMenus,
        }));
      },

      // Menu expand/collapse
      toggleMenu: (menuId: string) => {
        set((state) => {
          const isExpanded = state.expandedMenus.includes(menuId);
          
          return {
            expandedMenus: isExpanded
              ? state.expandedMenus.filter((id) => id !== menuId)
              : [...state.expandedMenus, menuId],
          };
        });
      },

      // Collapse all menus
      collapseAll: () => {
        set({ expandedMenus: [] });
      },

      // Expand all menus
      expandAll: () => {
        const allMenuIds: string[] = [];
        
        get().sections.forEach((section) => {
          section.items.forEach((item) => {
            if (item.children && item.children.length > 0) {
              allMenuIds.push(item.id);
              
              // Nested children
              item.children.forEach((child) => {
                if (child.children && child.children.length > 0) {
                  allMenuIds.push(child.id);
                }
              });
            }
          });
        });

        set({ expandedMenus: allMenuIds });
      },

      // Set user permissions
      setPermissions: (permissions: string[]) => {
        const sections = filterMenuByPermissions(MENU_CONFIG, permissions);
        set({
          sections,
          userPermissions: permissions,
        });
      },
    }),
    {
      name: 'menu-storage',
      partialize: (state) => ({
        collapsed: state.collapsed,
        expandedMenus: state.expandedMenus,
      }),
    }
  )
);

