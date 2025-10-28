import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  GraduationCap,
  TrendingUp,
  BookOpen,
  BarChart3,
  Languages,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Menu,
  Building2,
  School,
  Users,
  MapPin,
  UserCheck,
  Award,
  DollarSign,
  Calendar,
  Clock,
  Layers,
  Lightbulb,
  BookMarked,
  ScrollText,
  UserSquare2,
  UsersRound,
  Edit3,
  Activity,
  Microscope,
  Copyright,
  LayoutDashboard,
  FolderOpen,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path?: string
  badge?: string
  submenu?: Array<{
    label: string
    items: Array<{
      icon: React.ComponentType<{ className?: string }>
      label: string
      path: string
      badge?: string
    }>
  }>
}

const menuSections = [
  {
    title: 'ASOSIY',
    items: [
      { icon: LayoutDashboard, label: 'СТАТИСТИКА', path: '/dashboard', badge: 'Yangi' },
    ],
  },
  {
    title: 'MA\'LUMOTLAR',
    items: [
      {
        icon: FolderOpen,
        label: 'REESTRLAR',
        submenu: [
          {
            label: "O'quv",
            items: [
              { icon: Building2, label: 'OTMlar', path: '/universities' },
              { icon: School, label: 'Fakultetlar', path: '/faculties' },
              { icon: Users, label: 'Kafedralar', path: '/departments' },
              { icon: MapPin, label: "Ta'lim yo'nalishlari", path: '/directions' },
              { icon: UserCheck, label: "O'qituvchilar", path: '/teachers' },
              { icon: GraduationCap, label: 'Talabalar', path: '/students' },
              { icon: Award, label: 'Talaba stipendiyalari', path: '/scholarships' },
              { icon: DollarSign, label: 'OTM kvotalari', path: '/quotas' },
              { icon: BookOpen, label: "O'qituvchi malaka oshirishlari", path: '/trainings' },
              { icon: Calendar, label: "O'quv yillari", path: '/academic-years' },
              { icon: Clock, label: 'Semestrlar', path: '/semesters' },
              { icon: Layers, label: 'Kurslar', path: '/courses' },
            ]
          },
          {
            label: 'Ilmiy',
            items: [
              { icon: Lightbulb, label: 'Ilmiy loyihalar', path: '/projects' },
              { icon: BookMarked, label: 'Ilmiy nashrlar', path: '/publications' },
              { icon: ScrollText, label: 'Dissertasiya himoyalari', path: '/dissertations' },
              { icon: UserSquare2, label: 'Doktorantura talabalari', path: '/phd-students' },
              { icon: UsersRound, label: 'Loyiha ijrochilari', path: '/executors' },
              { icon: Edit3, label: 'Nashr mualliflari', path: '/authors' },
              { icon: Activity, label: 'Ilmiy faollik', path: '/research-activity' },
              { icon: Microscope, label: 'Ilmiy ishlanmalar', path: '/developments' },
              { icon: Copyright, label: 'Intellektual mulk obyektlari', path: '/intellectual-property' },
            ]
          }
        ]
      },
    ],
  },
  {
    title: 'TAHLIL',
    items: [
      { icon: TrendingUp, label: 'REYTING', path: '/rating' },
      { icon: BarChart3, label: 'HISOBOTLAR', path: '/reports' },
    ],
  },
  {
    title: 'SOZLAMALAR',
    items: [
      { icon: BookOpen, label: 'KLASSIFIKATORLAR', path: '/classifiers' },
      { icon: Languages, label: 'TARJIMALAR', path: '/translations' },
      { icon: FileText, label: 'SHABLONLAR', path: '/templates' },
      { icon: Settings, label: 'TIZIM', path: '/system' },
    ],
  },
  {
    title: '',
    items: [{ icon: HelpCircle, label: 'YORDAM', path: '/help' }],
  },
]

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  const isSubmenuExpanded = (label: string) => expandedMenus.includes(label)

  return (
    <aside className={cn(
      'relative flex h-screen flex-col border-r transition-all duration-300 backdrop-blur-xl',
      'bg-gradient-to-b from-slate-50/80 to-slate-100/80 dark:from-slate-900/80 dark:to-slate-800/80',
      'border-slate-200/50 dark:border-slate-700/50',
      open ? 'w-72' : 'w-20'
    )}>
      <div className="flex h-16 items-center justify-between px-4 shadow-lg backdrop-blur-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500">
        {open ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <div className="relative">
                <GraduationCap className="h-6 w-6 text-white" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">HEMIS</span>
              <span className="text-xs text-white/80">Ministry Portal</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <div className="relative">
              <GraduationCap className="h-6 w-6 text-white" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
            </div>
          </div>
        )}

        <Button
          onClick={() => setOpen(!open)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          {open ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && open && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item: MenuItem) => {
                  if (item.submenu) {
                    const isExpanded = isSubmenuExpanded(item.label)
                    const hasActiveSubmenu = item.submenu.some((category) =>
                      category.items.some((subItem) => location.pathname.startsWith(subItem.path))
                    )

                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => {
                            if (!open) setOpen(true)
                            toggleSubmenu(item.label)
                          }}
                          className={cn(
                            'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                            hasActiveSubmenu
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                            !open && 'justify-center'
                          )}
                        >
                          <item.icon className={cn('h-5 w-5', !open && 'h-6 w-6')} />
                          {open && (
                            <>
                              <span className="flex-1 font-medium text-left">{item.label}</span>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </>
                          )}
                        </button>

                        {open && isExpanded && (
                          <div className="ml-3 mt-1 space-y-1">
                            {item.submenu.map((category, categoryIndex) => (
                              <div key={categoryIndex} className="space-y-1">
                                <div className="px-3 py-1.5">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                    {category.label}
                                  </span>
                                </div>
                                {category.items.map((subItem) => {
                                  const isActive = location.pathname === subItem.path
                                  return (
                                    <Link
                                      key={subItem.path}
                                      to={subItem.path}
                                      className={cn(
                                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 text-sm',
                                        isActive
                                          ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100'
                                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                      )}
                                    >
                                      <subItem.icon className="h-4 w-4" />
                                      <span className="flex-1 font-medium">{subItem.label}</span>
                                      {subItem.badge && (
                                        <Badge variant="secondary" className="text-xs">
                                          {subItem.badge}
                                        </Badge>
                                      )}
                                    </Link>
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  const isActive = item.path ? location.pathname.startsWith(item.path) : false
                  return (
                    <Link
                      key={item.path}
                      to={item.path!}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                        !open && 'justify-center'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5', !open && 'h-6 w-6')} />
                      {open && (
                        <>
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary">{item.badge}</Badge>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200/50 p-4 dark:border-slate-800/50">
        {open ? (
          <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2 dark:from-purple-950/30 dark:to-indigo-950/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-900 dark:text-white">HEMIS Ministry</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Version 2.0.0</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

