/**
 * Menu Icons Map
 * old-hemis icon'larini Lucide icon'larga mapping qilish
 */

import {
  LayoutDashboard,
  Database,
  GraduationCap,
  TrendingUp,
  Building2,
  Users,
  BarChart3,
  BookOpen,
  Languages,
  Settings,
  HelpCircle,
  Folder,
  Globe,
  School,
  UserCheck,
  Award,
  DollarSign,
  Lightbulb,
  BookMarked,
  Edit3,
  Microscope,
  PieChart,
  LineChart,
  FlaskConical,
  Sparkles,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';

/**
 * old-hemis CUBA icon'larini Lucide icon'larga mapping
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  // CUBA Platform default icons
  'HOME': LayoutDashboard,
  'DATABASE': Database,
  'GRADUATION_CAP': GraduationCap,
  'LINE_CHART': LineChart,
  'BUILDING': Building2,
  'USERS': Users,
  'DASHBOARD': BarChart3,
  'BOOK': BookOpen,
  'LANGUAGE': Languages,
  'BAR_CHART_O': BarChart3,
  'MONEY': DollarSign,
  'GEAR': Settings,
  'WPFORMS': FolderOpen,
  'PIE_CHART': PieChart,
  'BAR_CHART': BarChart3,
  
  // Font-awesome style icons
  'font-icon:SHARE_ALT': School,
  'font-icon:USERS': Users,
  'font-icon:USER_CIRCLE': UserCheck,
  'font-icon:BOOK': BookOpen,
  'font-icon:PENCIL_SQUARE': Edit3,
  'font-icon:GRADUATION_CAP': GraduationCap,
  'font-icon:BUILDING_O': Building2,
  'font-icon:MORTAR_BOARD': GraduationCap,
  'font-icon:FLASK': FlaskConical,
  'font-icon:PAPER_PLANE': BookMarked,
  'font-icon:PRODUCT_HUNT': Lightbulb,
  'font-icon:GEAR': Settings,
  'font-icon:SOCCER_BALL_O': Award,
  
  // Custom mappings
  'HELP': HelpCircle,
  'FOLDER': Folder,
  'FOLDER_OPEN': FolderOpen,
  'SPARKLES': Sparkles,
};

/**
 * Icon nomidan Lucide component olish
 */
export function getIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return Folder;
  return ICON_MAP[iconName] || Folder;
}

/**
 * Module-specific icons
 */
export const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  registry: Database,
  rating: TrendingUp,
  classifiers: BookOpen,
  reports: BarChart3,
  settings: Settings,
  help: HelpCircle,
  
  // Registry subcategories
  educational: School,
  scientific: FlaskConical,
  
  // Classifier categories
  general: Globe,
  structure: School,
  employee: Users,
  student: GraduationCap,
  education: BookOpen,
  study: Edit3,
  science: Microscope,
  organizational: Building2,
  
  // Report categories
  university: Building2,
  teacher: UserCheck,
  academic: BookOpen,
  research: FlaskConical,
  economic: DollarSign,
};

