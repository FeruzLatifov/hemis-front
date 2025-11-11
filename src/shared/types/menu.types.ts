/**
 * Menu Types - Dinamik Menu Tizimi
 * old-hemis menu strukturasiga mos
 */

import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  code: string;              // Screen code (old-hemis format)
  title: string;             // Menu item nomi
  icon?: string;             // Icon nomi
  iconComponent?: LucideIcon; // Lucide icon component
  path?: string;             // Route path
  badge?: string;            // Badge matni ("Yangi", count)
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
  permission?: string;       // Permission key
  children?: MenuItem[];     // Submenu items
  order: number;             // Display order
  visible: boolean;          // Ko'rinish
  expanded?: boolean;        // Submenu expanded state
  openType?: 'SAME_TAB' | 'NEW_TAB' | 'DIALOG';
}

export interface MenuSection {
  id: string;
  title: string;             // Section title ("ASOSIY", "REESTR", etc.)
  icon?: string;
  iconComponent?: LucideIcon;
  items: MenuItem[];
  order: number;
  collapsed?: boolean;       // Section collapsed state
  visible: boolean;
}

export interface MenuConfig {
  sections: MenuSection[];
  version: string;
  lastUpdated: string;
}

export interface MenuPermission {
  menuId: string;
  roleIds: string[];
  userIds?: string[];
  allow: boolean;
}

