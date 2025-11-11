/**
 * Menu Configuration
 * old-hemis menu strukturasiga mos (Backend'dan kelgunga qadar)
 */

import { MenuSection } from '../types/menu.types';
import { MODULE_ICONS } from './menu-icons';

export const MENU_CONFIG: MenuSection[] = [
  // 1. DASHBOARD
  {
    id: 'dashboard',
    title: 'ASOSIY',
    items: [
      {
        id: 'dashboard-menu',
        code: 'hemishe_DashboardScreen',
        title: 'СТАТИСТИКА',
        iconComponent: MODULE_ICONS.dashboard,
        path: '/dashboard',
        badge: 'Yangi',
        order: 1,
        visible: true,
      },
    ],
    order: 1,
    visible: true,
  },

  // 2. REESTRLAR (Registry)
  {
    id: 'registry',
    title: 'MA\'LUMOTLAR',
    items: [
      {
        id: 'reestlar',
        code: 'Reestlar',
        title: 'REESTRLAR',
        iconComponent: MODULE_ICONS.registry,
        order: 1,
        visible: true,
        expanded: false,
        children: [
          {
            id: 'registry-educational',
            code: 'hemishe_EReestrNavigation',
            title: 'O\'quv reestr',
            iconComponent: MODULE_ICONS.educational,
            path: '/registry/educational',
            order: 1,
            visible: true,
          },
          {
            id: 'registry-scientific',
            code: 'hemishe_EReestrScientificNavigation',
            title: 'Ilmiy reestr',
            iconComponent: MODULE_ICONS.scientific,
            path: '/registry/scientific',
            order: 2,
            visible: true,
          },
        ],
      },
    ],
    order: 2,
    visible: true,
  },

  // 3. REYTING
  {
    id: 'rating',
    title: 'TAHLIL',
    items: [
      {
        id: 'reyting',
        code: 'reyting',
        title: 'REYTING',
        iconComponent: MODULE_ICONS.rating,
        order: 1,
        visible: true,
        expanded: false,
        children: [
          {
            id: 'rating-administrative',
            code: 'reyting-administrativ',
            title: 'Administrativ',
            iconComponent: MODULE_ICONS.university,
            order: 1,
            visible: true,
            children: [
              {
                id: 'rating-admin-employee',
                code: 'hemishe_RiAdministrativeEmployee',
                title: 'Xodimlar reytingi',
                iconComponent: MODULE_ICONS.employee,
                path: '/rating/administrative/employees',
                order: 1,
                visible: true,
              },
              {
                id: 'rating-admin-students',
                code: 'hemishe_RiAdministrativeStudents',
                title: 'Talabalar reytingi',
                iconComponent: MODULE_ICONS.student,
                path: '/rating/administrative/students',
                order: 2,
                visible: true,
              },
            ],
          },
          {
            id: 'rating-academic',
            code: 'akademik',
            title: 'Akademik',
            iconComponent: MODULE_ICONS.academic,
            order: 2,
            visible: true,
            children: [
              {
                id: 'rating-academic-methodical',
                code: 'hemishe_RIAcademicMethodical',
                title: 'Uslubiy nashrlar',
                iconComponent: MODULE_ICONS.education,
                path: '/rating/academic/methodical',
                order: 1,
                visible: true,
              },
              {
                id: 'rating-academic-study',
                code: 'hemishe_RIAcademicStudy',
                title: 'O\'quv faoliyati',
                iconComponent: MODULE_ICONS.study,
                path: '/rating/academic/study',
                order: 2,
                visible: true,
              },
            ],
          },
          {
            id: 'rating-scientific',
            code: 'ilmiy',
            title: 'Ilmiy',
            iconComponent: MODULE_ICONS.science,
            order: 3,
            visible: true,
            children: [
              {
                id: 'rating-scientific-publications',
                code: 'hemishe_RIScientificPublications',
                title: 'Ilmiy nashrlar',
                iconComponent: MODULE_ICONS.research,
                path: '/rating/scientific/publications',
                order: 1,
                visible: true,
              },
              {
                id: 'rating-scientific-projects',
                code: 'hemishe_RIScientificProjects',
                title: 'Ilmiy loyihalar',
                iconComponent: MODULE_ICONS.research,
                path: '/rating/scientific/projects',
                order: 2,
                visible: true,
              },
            ],
          },
        ],
      },
      {
        id: 'reports',
        code: 'application-hemishe-report',
        title: 'HISOBOTLAR',
        iconComponent: MODULE_ICONS.reports,
        order: 2,
        visible: true,
        expanded: false,
        children: [
          {
            id: 'reports-universities',
            code: 'application-hemishe-report-universities',
            title: 'OTM hisobotlari',
            iconComponent: MODULE_ICONS.university,
            path: '/reports/universities',
            order: 1,
            visible: true,
          },
          {
            id: 'reports-employees',
            code: 'application-hemishe-report-employees',
            title: 'Xodim hisobotlari',
            iconComponent: MODULE_ICONS.employee,
            path: '/reports/employees',
            order: 2,
            visible: true,
          },
          {
            id: 'reports-students',
            code: 'application-hemishe-report-students',
            title: 'Talaba hisobotlari',
            iconComponent: MODULE_ICONS.student,
            path: '/reports/students',
            order: 3,
            visible: true,
          },
          {
            id: 'reports-academic',
            code: 'application-hemishe-report-academic',
            title: 'Akademik hisobotlar',
            iconComponent: MODULE_ICONS.academic,
            path: '/reports/academic',
            order: 4,
            visible: true,
          },
          {
            id: 'reports-research',
            code: 'application-hemishe-report-research',
            title: 'Ilmiy hisobotlar',
            iconComponent: MODULE_ICONS.research,
            path: '/reports/research',
            order: 5,
            visible: true,
          },
          {
            id: 'reports-economic',
            code: 'application-hemishe-report-economic',
            title: 'Iqtisodiy hisobotlar',
            iconComponent: MODULE_ICONS.economic,
            path: '/reports/economic',
            order: 6,
            visible: true,
          },
        ],
      },
    ],
    order: 3,
    visible: true,
  },

  // 4. KLASSIFIKATORLAR
  {
    id: 'classifiers',
    title: 'SOZLAMALAR',
    items: [
      {
        id: 'classifiers-menu',
        code: 'application-hemishe',
        title: 'KLASSIFIKATORLAR',
        iconComponent: MODULE_ICONS.classifiers,
        order: 1,
        visible: true,
        expanded: false,
        children: [
          {
            id: 'classifier-general',
            code: 'hemishe_HGenealNavigation',
            title: 'Umumiy',
            iconComponent: MODULE_ICONS.general,
            path: '/classifiers/general',
            order: 1,
            visible: true,
          },
          {
            id: 'classifier-structure',
            code: 'hemishe_HStructureNavigation',
            title: 'Tuzilma',
            iconComponent: MODULE_ICONS.structure,
            path: '/classifiers/structure',
            order: 2,
            visible: true,
          },
          {
            id: 'classifier-employee',
            code: 'hemishe_HEmployeeNavigation',
            title: 'Xodim',
            iconComponent: MODULE_ICONS.employee,
            path: '/classifiers/employee',
            order: 3,
            visible: true,
          },
          {
            id: 'classifier-student',
            code: 'hemishe_HStudentNavigation',
            title: 'Talaba',
            iconComponent: MODULE_ICONS.student,
            path: '/classifiers/student',
            order: 4,
            visible: true,
          },
          {
            id: 'classifier-education',
            code: 'hemishe_HEducationNavigation',
            title: 'Ta\'lim',
            iconComponent: MODULE_ICONS.education,
            path: '/classifiers/education',
            order: 5,
            visible: true,
          },
          {
            id: 'classifier-study',
            code: 'hemishe_HStudyNavigation',
            title: 'O\'quv',
            iconComponent: MODULE_ICONS.study,
            path: '/classifiers/study',
            order: 6,
            visible: true,
          },
          {
            id: 'classifier-science',
            code: 'hemishe_HScienseNavigation',
            title: 'Ilmiy',
            iconComponent: MODULE_ICONS.science,
            path: '/classifiers/science',
            order: 7,
            visible: true,
          },
          {
            id: 'classifier-organizational',
            code: 'hemishe_HOrganizationalNavigation',
            title: 'Tashkiliy',
            iconComponent: MODULE_ICONS.organizational,
            path: '/classifiers/organizational',
            order: 8,
            visible: true,
          },
        ],
      },
      {
        id: 'translations',
        code: 'translation',
        title: 'TARJIMALAR',
        iconComponent: MODULE_ICONS.settings,
        path: '/translations',
        openType: 'NEW_TAB',
        order: 2,
        visible: true,
      },
      {
        id: 'settings',
        code: 'settings',
        title: 'TIZIM',
        iconComponent: MODULE_ICONS.settings,
        path: '/settings',
        order: 3,
        visible: true,
      },
    ],
    order: 4,
    visible: true,
  },

  // 5. YORDAM
  {
    id: 'help',
    title: '',
    items: [
      {
        id: 'help-menu',
        code: 'help',
        title: 'YORDAM',
        iconComponent: MODULE_ICONS.help,
        path: '/help',
        order: 1,
        visible: true,
      },
    ],
    order: 5,
    visible: true,
  },
];

/**
 * Menu config'ni filter qilish (permission'larga qarab)
 */
export function filterMenuByPermissions(
  sections: MenuSection[],
  userPermissions: string[]
): MenuSection[] {
  return sections
    .map(section => ({
      ...section,
      items: section.items
        .filter(item => !item.permission || userPermissions.includes(item.permission))
        .map(item => ({
          ...item,
          children: item.children?.filter(
            child => !child.permission || userPermissions.includes(child.permission)
          ),
        })),
    }))
    .filter(section => section.items.length > 0);
}

