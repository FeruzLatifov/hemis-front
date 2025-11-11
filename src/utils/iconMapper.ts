/**
 * Icon Mapper Utility
 *
 * Maps icon names from backend (CUBA style) to Lucide React components
 * Comprehensive mapping for HEMIS menu system
 */

import {
  Home,
  Database,
  LineChart,
  Book,
  BarChart,
  Settings,
  Languages,
  GraduationCap,
  Building,
  Users,
  LayoutDashboard,
  Send,
  Lightbulb,
  Trophy,
  FileText,
  Share2,
  UserCircle,
  Edit,
  Building2,
  PieChart,
  TestTube,
  Banknote,
  ShieldCheck,
  FolderOpen,
  School,
  MapPin,
  UserCheck,
  Award,
  DollarSign,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  Bookmark,
  ScrollText,
  UserSquare,
  Users as UsersIcon,
  Edit3,
  Activity,
  Beaker,
  Copyright,
  TrendingUp,
  BarChart3,
  HelpCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  // =====================================================
  // CUBA Icon Names → Lucide React Icons (Primary mapping for backend)
  // =====================================================

  // Root Level Menu Icons
  'home': Home,
  'HOME': Home,
  'database': Database,
  'DATABASE': Database,
  'line-chart': LineChart,
  'LINE_CHART': LineChart,
  'book': Book,
  'BOOK': Book,
  'bar-chart': BarChart,
  'BAR_CHART_O': BarChart,
  'settings': Settings,
  'GEAR': Settings,
  'languages': Languages,
  'LANGUAGE': Languages,

  // Level 2-3 Menu Icons
  'graduation-cap': GraduationCap,
  'GRADUATION_CAP': GraduationCap,
  'MORTAR_BOARD': GraduationCap,
  'building': Building,
  'BUILDING': Building,
  'building-2': Building2,
  'BUILDING_O': Building2,
  'users': Users,
  'USERS': Users,
  'layout-dashboard': LayoutDashboard,
  'DASHBOARD': LayoutDashboard,
  'send': Send,
  'PAPER_PLANE': Send,
  'lightbulb': Lightbulb,
  'PRODUCT_HUNT': Lightbulb,
  'trophy': Trophy,
  'SOCCER_BALL_O': Trophy,
  'file-text': FileText,
  'WPFORMS': FileText,
  'share-2': Share2,
  'SHARE_ALT': Share2,
  'user-circle': UserCircle,
  'USER_CIRCLE': UserCircle,
  'edit': Edit,
  'PENCIL_SQUARE': Edit,
  'pie-chart': PieChart,
  'PIE_CHART': PieChart,
  'flask': TestTube,
  'FLASK': TestTube,
  'banknote': Banknote,
  'MONEY': Banknote,
  'shield-check': ShieldCheck,
  'refresh-cw': RefreshCw,
  'award': Award,

  // =====================================================
  // Semantic Names (for backwards compatibility)
  // =====================================================
  Dashboard: LayoutDashboard,
  LayoutDashboard,

  // Data/Registry
  FolderOpen,
  Folder: FolderOpen,
  Registry: Database,

  // Educational
  Building2,
  University: Building2,
  School,
  Faculty: School,
  Users,
  Department: Users,
  MapPin,
  Direction: MapPin,
  UserCheck,
  Teacher: UserCheck,
  GraduationCap,
  Student: GraduationCap,
  Award,
  Scholarship: Award,
  DollarSign,
  Quota: DollarSign,
  BookOpen,
  Training: BookOpen,
  Calendar,
  AcademicYear: Calendar,
  Clock,
  Semester: Clock,
  Layers,
  Course: Layers,

  // Scientific
  Lightbulb,
  Project: Lightbulb,
  Bookmark,
  Publication: Bookmark,
  ScrollText,
  Dissertation: ScrollText,
  UserSquare,
  PhDStudent: UserSquare,
  UsersIcon,
  Executor: UsersIcon,
  Edit3,
  Author: Edit3,
  Activity,
  ResearchActivity: Activity,
  Beaker,
  Development: Beaker,
  Copyright,
  IntellectualProperty: Copyright,

  // Analysis
  TrendingUp,
  Rating: TrendingUp,
  BarChart3,
  Report: BarChart3,

  // Settings
  Languages,
  Translation: Languages,
  FileText,
  Template: FileText,
  Settings,
  System: Settings,

  // Help
  HelpCircle,
  Help: HelpCircle,
};

/**
 * Get Lucide icon component by name
 *
 * @param iconName Icon name from backend
 * @returns Lucide icon component or default icon
 */
export const getIcon = (iconName?: string): LucideIcon => {
  if (!iconName) {
    return FolderOpen; // Default icon
  }

  // Try exact match
  const icon = iconMap[iconName];
  if (icon) {
    return icon;
  }

  // Try with first letter uppercase
  const capitalizedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  const capitalizedIcon = iconMap[capitalizedName];
  if (capitalizedIcon) {
    return capitalizedIcon;
  }

  // Default icon
  return FolderOpen;
};
