# HEMIS Menu System - Implementation Plan

## Executive Summary

This document outlines the implementation plan for a dynamic, permission-based menu system for the new HEMIS (Higher Education Management Information System) application. The plan is based on analysis of three existing systems:

1. **UNIVER Backend/Frontend** - Modern Laravel + React implementation with best practices
2. **Old HEMIS CUBA** - Existing business logic and menu structure
3. **New HEMIS** - Target Spring Boot + React architecture

**Recommended Approach:** Hybrid configuration-database pattern combining UNIVER's technical excellence with old HEMIS business structure.

---

## 1. System Analysis Summary

### UNIVER System (Best Practice Reference)

**Backend (PHP/Laravel):**
- ✅ Configuration-based menu structure (`config/menu.php`)
- ✅ Database-stored permissions (RBAC tables)
- ✅ Sophisticated permission filtering (dot notation, wildcards, legacy routes)
- ✅ Multi-layer caching (3200 seconds TTL)
- ✅ Repository + Service pattern with DTOs
- ✅ Multi-language support with translation service
- ✅ Automatic cache invalidation on role/permission changes

**Frontend (React/TypeScript):**
- ✅ Zustand store with sessionStorage persistence
- ✅ Dynamic rendering with recursive components
- ✅ Permission-based visibility checks
- ✅ Icon mapping (Lucide React)
- ✅ 2-layer caching (frontend + backend)
- ✅ Clean component hierarchy

**Key API Endpoints:**
- `GET /api/v1/web/menu?locale={locale}` - Get filtered menu
- `POST /api/v1/web/menu/check-access` - Check path access
- `POST /api/v1/web/menu/clear-cache` - Clear cache
- `GET /api/v1/web/menu/structure` - Get full menu (admin only)

### Old HEMIS CUBA (Business Structure Reference)

**Menu Structure:**
```
Dashboard
├── Reestrlar (Registries)
│   ├── O'quv (Academic Registry)
│   ├── Ilmiy (Scientific Registry)
│   └── Talaba Meta (Student Meta)
├── Reyting (Rating)
│   ├── Administrativ (Administrative)
│   │   ├── O'qituvchilar (Teachers)
│   │   ├── Talabalar (Students)
│   │   └── Sport inshootlari (Sports Facilities)
│   ├── Akademik (Academic)
│   │   ├── Uslubiy nashrlar (Publications)
│   │   ├── O'quv ishlari (Study Works)
│   │   └── Verifikasiya (Verification)
│   ├── Ilmiy (Scientific)
│   │   ├── Ilmiy maqolalar (Publications)
│   │   ├── Ilmiy loyihalar (Projects)
│   │   └── Intellektual mulk (IP)
│   └── Talaba GPA
├── Klassifikatorlar (Classifiers)
│   ├── Umumiy (General)
│   ├── Struktura (Structure)
│   ├── Xodimlar (Employees)
│   ├── Talabalar (Students)
│   ├── Ta'lim (Education)
│   ├── O'qitish (Study)
│   ├── Ilmiy (Science)
│   └── Tashkiliy (Organizational)
├── Hisobotlar (Reports)
│   ├── Muassasalar (Universities)
│   ├── Xodimlar (Employees)
│   ├── Talabalar (Students)
│   ├── Akademik (Academic)
│   ├── Ilmiy tadqiqotlar (Research)
│   └── Iqtisod (Economic)
├── Tarjimalar (Translations)
├── API foydalanuvchilari (API Users)
└── Settings
```

**Key Insights:**
- Hierarchical structure (up to 3 levels deep)
- Business domains: Academic, Scientific, Administrative, Reports
- Uses visual navigation screens (menu grids) for second-tier navigation
- Permission-based visibility via CUBA security framework

---

## 2. Recommended Approach

### Architecture Decision

**Use Configuration-Based Menus with Database Permissions**

**Rationale:**
1. **Performance:** Config files are faster than database queries (compiled into application)
2. **Maintainability:** Centralized menu structure in one place
3. **Type Safety:** Can be validated at compile time
4. **Caching:** Easier to cache and invalidate
5. **Version Control:** Menu changes tracked in Git
6. **Security:** Permissions in database for runtime flexibility

### Technology Stack

**Backend:**
- Spring Boot 3.x
- PostgreSQL (existing)
- Redis (for caching)
- Flyway (for migrations)
- Jackson (for JSON serialization)

**Frontend:**
- React 18
- TypeScript
- Zustand (state management)
- React Router (navigation)
- Lucide React (icons)
- Tailwind CSS (styling)

---

## 3. Database Schema Design

### 3.1 Permission Tables

We'll create a lightweight permission system compatible with Spring Security:

#### Table: `system_role`
```sql
CREATE TABLE system_role (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,           -- e.g., 'super_admin', 'university_admin'
    name VARCHAR(255) NOT NULL,                 -- Display name
    description TEXT,
    parent_id BIGINT REFERENCES system_role(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',        -- 'active', 'inactive'
    "order" INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_system_role_code ON system_role(code);
CREATE INDEX idx_system_role_parent ON system_role(parent_id);
```

#### Table: `system_permission`
```sql
CREATE TABLE system_permission (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,          -- e.g., 'student.view', 'teacher.create'
    name VARCHAR(255) NOT NULL,                 -- Display name
    description TEXT,
    category VARCHAR(50),                        -- e.g., 'student', 'teacher', 'report'
    resource_path VARCHAR(255),                  -- URL pattern: '/students', '/teachers'
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_system_permission_code ON system_permission(code);
CREATE INDEX idx_system_permission_category ON system_permission(category);
CREATE INDEX idx_system_permission_active ON system_permission(is_active);
```

#### Table: `system_role_permission`
```sql
CREATE TABLE system_role_permission (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES system_role(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES system_permission(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),

    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permission_role ON system_role_permission(role_id);
CREATE INDEX idx_role_permission_permission ON system_role_permission(permission_id);
```

#### Table: `system_user_role`
```sql
CREATE TABLE system_user_role (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES system_user(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES system_role(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),

    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_role_user ON system_user_role(user_id);
CREATE INDEX idx_user_role_role ON system_user_role(role_id);
```

### 3.2 Initial Data

#### Default Roles:
```sql
INSERT INTO system_role (code, name, description, "order") VALUES
('super_admin', 'Super Administrator', 'Full system access', 1),
('university_admin', 'University Administrator', 'University-level administration', 2),
('faculty_admin', 'Faculty Administrator', 'Faculty-level administration', 3),
('department_admin', 'Department Administrator', 'Department-level administration', 4),
('teacher', 'Teacher', 'Teaching staff access', 5),
('student', 'Student', 'Student access', 6);
```

#### Sample Permissions:
```sql
INSERT INTO system_permission (code, name, category, resource_path) VALUES
-- Wildcard permissions
('*', 'All Permissions', 'system', '*'),
('student.*', 'All Student Permissions', 'student', '/students/*'),
('teacher.*', 'All Teacher Permissions', 'teacher', '/teachers/*'),

-- Specific permissions
('dashboard.view', 'View Dashboard', 'dashboard', '/dashboard'),
('student.view', 'View Students', 'student', '/students'),
('student.create', 'Create Student', 'student', '/students/create'),
('student.edit', 'Edit Student', 'student', '/students/edit'),
('student.delete', 'Delete Student', 'student', '/students/delete'),
('teacher.view', 'View Teachers', 'teacher', '/teachers'),
('teacher.create', 'Create Teacher', 'teacher', '/teachers/create'),
('report.view', 'View Reports', 'report', '/reports'),
('university.view', 'View Universities', 'university', '/universities');
```

#### Grant super_admin all permissions:
```sql
INSERT INTO system_role_permission (role_id, permission_id)
SELECT
    (SELECT id FROM system_role WHERE code = 'super_admin'),
    id
FROM system_permission
WHERE code = '*';
```

---

## 4. Backend Implementation Plan

### 4.1 Project Structure

```
hemis-back/
├── domain/
│   └── src/main/java/uz/hemis/domain/
│       ├── entity/
│       │   ├── SystemRole.java
│       │   ├── SystemPermission.java
│       │   ├── SystemRolePermission.java
│       │   └── SystemUserRole.java
│       └── repository/
│           ├── SystemRoleRepository.java
│           ├── SystemPermissionRepository.java
│           └── SystemUserRoleRepository.java
├── service/
│   └── src/main/java/uz/hemis/service/
│       ├── menu/
│       │   ├── MenuService.java
│       │   ├── MenuConfig.java
│       │   └── dto/
│       │       ├── MenuItemDTO.java
│       │       └── MenuResponseDTO.java
│       └── permission/
│           ├── PermissionService.java
│           └── RoleService.java
├── web/
│   └── src/main/java/uz/hemis/web/
│       └── controller/
│           └── MenuController.java
└── app/
    └── src/main/resources/
        ├── application.yml (Redis config)
        └── db/migration/
            └── V8__Create_Menu_Permission_Tables.sql
```

### 4.2 Menu Configuration

**File: `service/src/main/java/uz/hemis/service/menu/MenuConfig.java`**

```java
@Configuration
public class MenuConfig {

    @Bean
    public List<MenuItem> menuStructure() {
        return Arrays.asList(
            // Dashboard
            MenuItem.builder()
                .id("dashboard")
                .label("menu.dashboard")
                .url("/dashboard")
                .icon("layout-dashboard")
                .permission("dashboard.view")
                .order(1)
                .build(),

            // Students
            MenuItem.builder()
                .id("students")
                .label("menu.students")
                .url("/students")
                .icon("users")
                .permission("student.view")
                .order(2)
                .build(),

            // Teachers
            MenuItem.builder()
                .id("teachers")
                .label("menu.teachers")
                .url("/teachers")
                .icon("user-circle")
                .permission("teacher.view")
                .order(3)
                .build(),

            // Universities
            MenuItem.builder()
                .id("universities")
                .label("menu.universities")
                .url("/universities")
                .icon("building")
                .permission("university.view")
                .order(4)
                .build(),

            // Reports (with children)
            MenuItem.builder()
                .id("reports")
                .label("menu.reports")
                .url("/reports")
                .icon("file-text")
                .permission("report.view")
                .order(5)
                .children(Arrays.asList(
                    MenuItem.builder()
                        .id("reports-students")
                        .label("menu.reports.students")
                        .url("/reports/students")
                        .icon("users")
                        .permission("report.students.view")
                        .order(1)
                        .build(),
                    MenuItem.builder()
                        .id("reports-teachers")
                        .label("menu.reports.teachers")
                        .url("/reports/teachers")
                        .icon("user-circle")
                        .permission("report.teachers.view")
                        .order(2)
                        .build()
                ))
                .build()
        );
    }
}
```

### 4.3 Menu DTOs

**MenuItemDTO.java:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemDTO {
    private String id;
    private String label;
    private String url;
    private String icon;
    private String permission;
    private List<MenuItemDTO> items = new ArrayList<>();
    private Boolean active = true;
    private Integer order;
}
```

**MenuResponseDTO.java:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuResponseDTO {
    private List<MenuItemDTO> menu;
    private List<String> permissions;
    private String locale;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private MetaData _meta;

    @Data
    @Builder
    public static class MetaData {
        private Boolean cached;
        private Long cacheExpiresAt;
        private String generatedAt;
    }
}
```

### 4.4 Menu Service

**MenuService.java:**
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuService {

    private final MenuConfig menuConfig;
    private final PermissionService permissionService;
    private final I18nService i18nService;
    private final CacheManager cacheManager;

    private static final String MENU_CACHE_NAME = "menus";
    private static final int MENU_CACHE_TTL = 3600; // 1 hour

    /**
     * Get filtered menu for authenticated user
     */
    public MenuResponseDTO getMenuForUser(String userId, String locale) {
        log.debug("Getting menu for user: {}, locale: {}", userId, locale);

        String cacheKey = String.format("menu:user:%s:locale:%s", userId, locale);

        // Check cache
        Cache cache = cacheManager.getCache(MENU_CACHE_NAME);
        if (cache != null) {
            MenuResponseDTO cached = cache.get(cacheKey, MenuResponseDTO.class);
            if (cached != null) {
                log.debug("Returning cached menu for user: {}", userId);
                return cached;
            }
        }

        // Get user permissions
        List<String> userPermissions = permissionService.getUserPermissions(userId);

        // Get menu structure
        List<MenuItem> menuStructure = menuConfig.menuStructure();

        // Filter by permissions
        List<MenuItemDTO> filteredMenu = filterMenuByPermissions(
            menuStructure,
            userPermissions,
            locale
        );

        // Sort by order
        sortMenuItems(filteredMenu);

        // Build response
        MenuResponseDTO response = MenuResponseDTO.builder()
            .menu(filteredMenu)
            .permissions(userPermissions)
            .locale(locale)
            ._meta(MenuResponseDTO.MetaData.builder()
                .cached(false)
                .cacheExpiresAt(System.currentTimeMillis() + (MENU_CACHE_TTL * 1000))
                .generatedAt(LocalDateTime.now().toString())
                .build())
            .build();

        // Cache result
        if (cache != null) {
            cache.put(cacheKey, response);
        }

        return response;
    }

    /**
     * Filter menu items by user permissions (recursive)
     */
    private List<MenuItemDTO> filterMenuByPermissions(
        List<MenuItem> items,
        List<String> permissions,
        String locale
    ) {
        List<MenuItemDTO> filtered = new ArrayList<>();

        for (MenuItem item : items) {
            // Check if user has permission
            if (hasPermission(item.getPermission(), permissions)) {
                MenuItemDTO dto = MenuItemDTO.builder()
                    .id(item.getId())
                    .label(i18nService.translate(item.getLabel(), locale))
                    .url(item.getUrl())
                    .icon(item.getIcon())
                    .permission(item.getPermission())
                    .active(item.getActive())
                    .order(item.getOrder())
                    .build();

                // Filter children recursively
                if (item.getChildren() != null && !item.getChildren().isEmpty()) {
                    List<MenuItemDTO> filteredChildren = filterMenuByPermissions(
                        item.getChildren(),
                        permissions,
                        locale
                    );
                    dto.setItems(filteredChildren);
                }

                filtered.add(dto);
            }
        }

        return filtered;
    }

    /**
     * Check if user has permission (with wildcard support)
     */
    private boolean hasPermission(String required, List<String> userPermissions) {
        if (required == null || required.isEmpty()) {
            return true; // No permission required
        }

        // Super admin wildcard
        if (userPermissions.contains("*")) {
            return true;
        }

        // Exact match
        if (userPermissions.contains(required)) {
            return true;
        }

        // Wildcard pattern matching (e.g., 'student.*' matches 'student.view')
        for (String permission : userPermissions) {
            if (permission.endsWith(".*")) {
                String prefix = permission.substring(0, permission.length() - 2);
                if (required.startsWith(prefix + ".")) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Sort menu items by order field
     */
    private void sortMenuItems(List<MenuItemDTO> items) {
        items.sort(Comparator.comparing(
            MenuItemDTO::getOrder,
            Comparator.nullsLast(Comparator.naturalOrder())
        ));

        // Sort children recursively
        for (MenuItemDTO item : items) {
            if (item.getItems() != null && !item.getItems().isEmpty()) {
                sortMenuItems(item.getItems());
            }
        }
    }

    /**
     * Clear menu cache for specific user
     */
    public void clearCacheForUser(String userId) {
        Cache cache = cacheManager.getCache(MENU_CACHE_NAME);
        if (cache != null) {
            List<String> locales = Arrays.asList("uz-UZ", "ru-RU", "en-US");
            for (String locale : locales) {
                String cacheKey = String.format("menu:user:%s:locale:%s", userId, locale);
                cache.evict(cacheKey);
            }
        }
    }

    /**
     * Clear all menu caches
     */
    public void clearAllCache() {
        Cache cache = cacheManager.getCache(MENU_CACHE_NAME);
        if (cache != null) {
            cache.clear();
        }
    }
}
```

### 4.5 Menu Controller

**MenuController.java:**
```java
@RestController
@RequestMapping("/api/v1/web/menu")
@RequiredArgsConstructor
@Slf4j
public class MenuController {

    private final MenuService menuService;
    private final PermissionService permissionService;

    /**
     * GET /api/v1/web/menu?locale=uz-UZ
     * Get filtered menu for authenticated user
     */
    @GetMapping
    public ResponseEntity<MenuResponseDTO> getMenu(
        @RequestParam(defaultValue = "uz-UZ") String locale,
        @AuthenticationPrincipal JwtAuthenticationToken token
    ) {
        String userId = token.getName();
        MenuResponseDTO menu = menuService.getMenuForUser(userId, locale);
        return ResponseEntity.ok(menu);
    }

    /**
     * POST /api/v1/web/menu/check-access
     * Check if user can access specific path
     */
    @PostMapping("/check-access")
    public ResponseEntity<Map<String, Boolean>> checkAccess(
        @RequestBody Map<String, String> request,
        @AuthenticationPrincipal JwtAuthenticationToken token
    ) {
        String path = request.get("path");
        String userId = token.getName();

        boolean accessible = permissionService.canAccessPath(userId, path);

        return ResponseEntity.ok(Map.of("accessible", accessible));
    }

    /**
     * POST /api/v1/web/menu/clear-cache
     * Clear menu cache (all users)
     */
    @PostMapping("/clear-cache")
    public ResponseEntity<Map<String, Object>> clearCache() {
        menuService.clearAllCache();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Menu cache cleared successfully"
        ));
    }

    /**
     * GET /api/v1/web/menu/structure
     * Get full menu structure (admin only)
     */
    @GetMapping("/structure")
    @PreAuthorize("hasAuthority('*') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<MenuItem>> getStructure() {
        List<MenuItem> structure = menuService.getFullMenuStructure();
        return ResponseEntity.ok(structure);
    }
}
```

---

## 5. Frontend Implementation Plan

### 5.1 Menu Store

**File: `src/stores/menuStore.ts`**

```typescript
interface MenuItem {
  id: string
  label: string
  url: string
  icon: string
  permission?: string | null
  items: MenuItem[]
  active: boolean
  order?: number | null
}

interface MenuResponse {
  menu: MenuItem[]
  permissions: string[]
  locale: string
  _meta?: {
    cached: boolean
    cacheExpiresAt: number | null
    generatedAt: string
  }
}

interface MenuStore {
  // State
  menu: MenuItem[]
  permissions: string[]
  locale: string
  loading: boolean
  error: string | null
  cached: boolean
  cacheExpiresAt: number | null
  activeMenuId: string | null

  // Actions
  fetchMenu: (locale?: string) => Promise<void>
  clearCache: () => Promise<void>
  setActiveMenu: (menuId: string | null) => void
  canAccessPath: (path: string) => boolean
  findMenuByUrl: (url: string) => MenuItem | undefined
  getMenuBreadcrumbs: (menuId: string) => MenuItem[]
  refreshMenu: () => Promise<void>
}

// SessionStorage adapter for security
const sessionStorageAdapter = {
  getItem: (name: string) => sessionStorage.getItem(name),
  setItem: (name: string, value: string) => sessionStorage.setItem(name, value),
  removeItem: (name: string) => sessionStorage.removeItem(name),
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      // Initial state
      menu: [],
      permissions: [],
      locale: 'uz-UZ',
      loading: false,
      error: null,
      cached: false,
      cacheExpiresAt: null,
      activeMenuId: null,

      // Fetch menu from backend
      fetchMenu: async (locale?: string) => {
        set({ loading: true, error: null })

        try {
          const currentLocale = locale || get().locale
          const response = await menuApi.getMenu(currentLocale)

          set({
            menu: response.menu,
            permissions: response.permissions,
            locale: response.locale,
            cached: response._meta?.cached || false,
            cacheExpiresAt: response._meta?.cacheExpiresAt || null,
            loading: false,
            error: null,
          })
        } catch (err) {
          console.error('Failed to fetch menu:', err)
          set({
            error: 'Failed to load menu',
            loading: false,
          })
        }
      },

      // Clear backend cache and refetch
      clearCache: async () => {
        try {
          await menuApi.clearCache()
          await get().fetchMenu()
        } catch (err) {
          console.error('Failed to clear menu cache:', err)
        }
      },

      // Set active menu item
      setActiveMenu: (menuId) => {
        set({ activeMenuId: menuId })
      },

      // Check if user can access path
      canAccessPath: (path: string) => {
        const { permissions } = get()

        // Super admin
        if (permissions.includes('*')) {
          return true
        }

        // Convert path to permission
        // '/students' -> 'student.view'
        const normalizedPath = path.replace(/^\/+|\/+$/g, '')
        const parts = normalizedPath.split('/')
        const resource = parts[0]
        const action = parts[1] || 'view'
        const permission = `${resource}.${action}`

        return (
          permissions.includes(permission) ||
          permissions.includes(`${resource}.*`)
        )
      },

      // Find menu item by URL
      findMenuByUrl: (url: string) => {
        const findRecursive = (items: MenuItem[]): MenuItem | undefined => {
          for (const item of items) {
            if (item.url === url) return item
            if (item.items.length > 0) {
              const found = findRecursive(item.items)
              if (found) return found
            }
          }
          return undefined
        }
        return findRecursive(get().menu)
      },

      // Get breadcrumbs for menu item
      getMenuBreadcrumbs: (menuId: string) => {
        const breadcrumbs: MenuItem[] = []

        const findPath = (items: MenuItem[], path: MenuItem[]): boolean => {
          for (const item of items) {
            if (item.id === menuId) {
              breadcrumbs.push(...path, item)
              return true
            }
            if (item.items.length > 0) {
              if (findPath(item.items, [...path, item])) {
                return true
              }
            }
          }
          return false
        }

        findPath(get().menu, [])
        return breadcrumbs
      },

      // Refresh menu (bypass cache)
      refreshMenu: async () => {
        await get().clearCache()
      },
    }),
    {
      name: 'hemis-menu-storage',
      storage: sessionStorageAdapter,
      partialize: (state) => ({
        menu: state.menu,
        permissions: state.permissions,
        locale: state.locale,
        cached: state.cached,
        cacheExpiresAt: state.cacheExpiresAt,
        activeMenuId: state.activeMenuId,
      }),
    }
  )
)
```

### 5.2 Menu API Client

**File: `src/lib/api/menu.api.ts`**

```typescript
import { apiClient } from './client'

export interface MenuItem {
  id: string
  label: string
  url: string
  icon: string
  permission?: string | null
  items: MenuItem[]
  active: boolean
  order?: number | null
}

export interface MenuResponse {
  menu: MenuItem[]
  permissions: string[]
  locale: string
  _meta?: {
    cached: boolean
    cacheExpiresAt: number | null
    generatedAt: string
  }
}

export interface CheckAccessResponse {
  accessible: boolean
}

export const menuApi = {
  /**
   * Get filtered menu for authenticated user
   */
  getMenu: async (locale?: string): Promise<MenuResponse> => {
    const response = await apiClient.get<MenuResponse>('/v1/web/menu', {
      params: { locale },
    })
    return response.data
  },

  /**
   * Check if user can access specific path
   */
  checkAccess: async (path: string): Promise<CheckAccessResponse> => {
    const response = await apiClient.post<CheckAccessResponse>(
      '/v1/web/menu/check-access',
      { path }
    )
    return response.data
  },

  /**
   * Clear menu cache
   */
  clearCache: async () => {
    const response = await apiClient.post('/v1/web/menu/clear-cache')
    return response.data
  },

  /**
   * Get full menu structure (admin only)
   */
  getStructure: async (): Promise<MenuItem[]> => {
    const response = await apiClient.get<MenuItem[]>('/v1/web/menu/structure')
    return response.data
  },
}
```

### 5.3 Sidebar Component

**File: `src/components/layouts/Sidebar.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMenuStore } from '@/stores/menuStore'
import * as LucideIcons from 'lucide-react'
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const { menu, loading, error, fetchMenu } = useMenuStore()

  // Fetch menu on mount
  useEffect(() => {
    if (menu.length === 0) {
      fetchMenu()
    }
  }, [])

  // Icon mapper
  const getIcon = (iconName: string) => {
    // Convert kebab-case to PascalCase
    // 'layout-dashboard' -> 'LayoutDashboard'
    const pascalCase = iconName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')

    const iconMap = LucideIcons as Record<string, any>
    const Icon = iconMap[pascalCase] || LucideIcons.Circle

    return <Icon className="w-4 h-4" />
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => fetchMenu()}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  // Recursive menu item component
  function MenuItemComponent({ item, level = 0 }: any) {
    const [isExpanded, setIsExpanded] = useState(false)
    const hasChildren = item.items && item.items.length > 0
    const isActive = location.pathname === item.url

    // Auto-expand if child is active
    useEffect(() => {
      if (hasChildren && item.items.some((child: any) =>
        location.pathname.startsWith(child.url)
      )) {
        setIsExpanded(true)
      }
    }, [location.pathname])

    return (
      <div>
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-active-bg"
          >
            {getIcon(item.icon)}
            <span className="flex-1 text-left text-sm">{item.label}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        ) : (
          <Link
            to={item.url}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'hover:bg-active-bg'
            }`}
          >
            {getIcon(item.icon)}
            <span className="text-sm">{item.label}</span>
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.items.map((child: any) => (
              <MenuItemComponent key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className="space-y-1">
      {menu.map((item) => (
        <MenuItemComponent key={item.id} item={item} level={0} />
      ))}
    </nav>
  )
}
```

### 5.4 Permission Hook

**File: `src/hooks/usePermission.ts`**

```typescript
import { useMenuStore } from '@/stores/menuStore'

/**
 * Check if user has specific permission
 */
export const usePermission = (permission: string): boolean => {
  const permissions = useMenuStore((state) => state.permissions)

  // Super admin
  if (permissions.includes('*')) {
    return true
  }

  // Exact match
  if (permissions.includes(permission)) {
    return true
  }

  // Wildcard pattern
  const parts = permission.split('.')
  if (parts.length >= 2) {
    const wildcardPermission = `${parts[0]}.*`
    if (permissions.includes(wildcardPermission)) {
      return true
    }
  }

  return false
}

/**
 * Check multiple permissions (OR logic)
 */
export const useAnyPermission = (permissions: string[]): boolean => {
  return permissions.some((permission) => usePermission(permission))
}

/**
 * Check multiple permissions (AND logic)
 */
export const useAllPermissions = (permissions: string[]): boolean => {
  return permissions.every((permission) => usePermission(permission))
}
```

---

## 6. Implementation Steps

### Phase 1: Backend Setup (2-3 days)

1. **Create database migration (V8)**
   - Create permission tables
   - Insert default roles and permissions
   - Assign super_admin all permissions

2. **Create domain entities**
   - SystemRole, SystemPermission, SystemRolePermission, SystemUserRole
   - Add repositories

3. **Create menu configuration**
   - MenuConfig.java with initial menu structure
   - Start with 5-6 basic menu items

4. **Create menu service**
   - MenuService.java with filtering logic
   - PermissionService.java
   - Implement caching with Redis

5. **Create menu controller**
   - 4 endpoints: getMenu, checkAccess, clearCache, getStructure
   - Add security configuration

6. **Add translations**
   - Add menu labels to system_message table (V9 migration)

### Phase 2: Frontend Setup (2-3 days)

1. **Create menu store**
   - Zustand store with sessionStorage persistence
   - fetchMenu, clearCache, permission checks

2. **Create menu API client**
   - Axios integration
   - Type definitions

3. **Update Sidebar component**
   - Dynamic rendering from menuStore
   - Recursive menu items
   - Icon mapping
   - Loading/error states

4. **Create permission hooks**
   - usePermission, useAnyPermission, useAllPermissions

5. **Update App.tsx**
   - Uncomment useMenuInit()
   - Add menu fetch on login

6. **Test integration**
   - Login as admin
   - Verify menu loads
   - Test permission filtering

### Phase 3: Menu Content Migration (3-5 days)

1. **Analyze old HEMIS menu structure**
   - Map CUBA screens to React routes
   - Create URL structure

2. **Update MenuConfig.java**
   - Add all menu items from old HEMIS
   - Organize hierarchically

3. **Create permissions**
   - Migration script for all permissions
   - Assign to roles

4. **Add translations**
   - All menu labels in 3 languages

5. **Create placeholder pages**
   - Empty pages for each menu item
   - Basic layout and breadcrumbs

### Phase 4: Testing and Optimization (1-2 days)

1. **Test permission filtering**
   - Test with different roles
   - Verify wildcard permissions work

2. **Test caching**
   - Verify Redis caching works
   - Test cache invalidation

3. **Performance testing**
   - Menu load time < 100ms (cached)
   - First load < 500ms

4. **UI/UX testing**
   - Test on different screen sizes
   - Test menu collapse/expand
   - Test active state tracking

---

## 7. Testing Strategy

### Backend Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
class MenuControllerTest {

    @Test
    void getMenu_shouldReturnFilteredMenu_forAuthenticatedUser() {
        // Given: user with 'student.view' permission
        // When: GET /api/v1/web/menu
        // Then: menu contains only items with matching permissions
    }

    @Test
    void getMenu_shouldReturnAllItems_forSuperAdmin() {
        // Given: user with '*' permission
        // When: GET /api/v1/web/menu
        // Then: menu contains all items
    }

    @Test
    void checkAccess_shouldReturnTrue_whenUserHasPermission() {
        // Given: user with 'student.view' permission
        // When: POST /api/v1/web/menu/check-access {path: "/students"}
        // Then: returns {accessible: true}
    }

    @Test
    void wildcardPermission_shouldMatchAllSubPermissions() {
        // Given: user with 'student.*' permission
        // When: checking 'student.view', 'student.create', 'student.edit'
        // Then: all return true
    }

    @Test
    void menuCache_shouldBeInvalidated_whenRoleUpdated() {
        // Given: cached menu for user
        // When: user's role updated
        // Then: cache cleared, new menu returned
    }
}
```

### Frontend Tests

```typescript
describe('MenuStore', () => {
  test('fetchMenu should load menu from API', async () => {
    // Arrange
    const mockMenu = [{ id: 'dashboard', label: 'Dashboard', ... }]
    mockApi.getMenu.mockResolvedValue({ menu: mockMenu, permissions: ['*'] })

    // Act
    await useMenuStore.getState().fetchMenu()

    // Assert
    expect(useMenuStore.getState().menu).toEqual(mockMenu)
  })

  test('canAccessPath should return true for super admin', () => {
    // Arrange
    useMenuStore.setState({ permissions: ['*'] })

    // Act & Assert
    expect(useMenuStore.getState().canAccessPath('/students')).toBe(true)
  })

  test('wildcard permission should match sub-permissions', () => {
    // Arrange
    useMenuStore.setState({ permissions: ['student.*'] })

    // Act & Assert
    expect(useMenuStore.getState().canAccessPath('/students')).toBe(true)
    expect(useMenuStore.getState().canAccessPath('/students/create')).toBe(true)
  })
})

describe('Sidebar', () => {
  test('should render menu items from store', () => {
    // Arrange
    const mockMenu = [{ id: 'dashboard', label: 'Dashboard', url: '/dashboard', icon: 'layout-dashboard' }]
    useMenuStore.setState({ menu: mockMenu, loading: false })

    // Act
    render(<Sidebar />)

    // Assert
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('should expand submenu when child is active', () => {
    // Arrange
    const mockMenu = [{
      id: 'reports',
      label: 'Reports',
      items: [{ id: 'reports-students', label: 'Student Reports', url: '/reports/students' }]
    }]
    useMenuStore.setState({ menu: mockMenu })

    // Act
    render(<MemoryRouter initialEntries={['/reports/students']}><Sidebar /></MemoryRouter>)

    // Assert
    expect(screen.getByText('Student Reports')).toBeVisible()
  })
})
```

---

## 8. Migration Strategy

### Data Migration

**Step 1: Export old HEMIS menu structure**
```bash
# Extract menu items from web-menu.xml
# Map to new structure
# Generate SQL insert statements
```

**Step 2: Create permissions from menu items**
```sql
-- Extract unique permission patterns from MenuConfig
-- Create permission records
-- Assign to roles based on old HEMIS security groups
```

**Step 3: Map users to new roles**
```sql
-- Map CUBA security groups to new system_role
-- Create system_user_role records
```

### Gradual Rollout

1. **Week 1:** Deploy with basic menu (Dashboard, Students, Teachers, Universities, Reports)
2. **Week 2:** Add Classifiers submenu
3. **Week 3:** Add Rating submenu
4. **Week 4:** Complete all menu items

### Rollback Plan

If issues occur:
1. Comment out useMenuInit() in App.tsx
2. Use static menu from config file
3. Fix issues in staging
4. Redeploy

---

## 9. Performance Metrics

### Target Metrics

- **First menu load (cold):** < 500ms
- **Cached menu load:** < 50ms
- **Menu filtering time:** < 10ms
- **Backend cache hit rate:** > 90%
- **Database queries per request:** 0 (cached)

### Monitoring

```java
@Aspect
@Component
public class MenuPerformanceAspect {

    @Around("execution(* uz.hemis.service.menu.MenuService.getMenuForUser(..))")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long executionTime = System.currentTimeMillis() - start;

        log.info("Menu load time: {}ms", executionTime);

        if (executionTime > 1000) {
            log.warn("SLOW MENU LOAD: {}ms", executionTime);
        }

        return result;
    }
}
```

---

## 10. Summary

### Recommended Approach
✅ **Configuration-based menu structure** (MenuConfig.java)
✅ **Database-stored permissions** (system_role, system_permission tables)
✅ **Redis caching** (1-hour TTL with auto-invalidation)
✅ **Zustand + sessionStorage** on frontend
✅ **Wildcard permissions** (student.*, report.*, *)
✅ **Recursive permission filtering** server-side
✅ **Dynamic rendering** with Lucide icons

### Key Benefits
- **Performance:** Cached responses < 50ms
- **Security:** Server-side filtering, session-based storage
- **Maintainability:** Centralized configuration
- **Flexibility:** Easy to add/remove menu items
- **Scalability:** Handles 100+ menu items efficiently
- **Type Safety:** Full TypeScript support
- **Best Practices:** Based on proven UNIVER implementation

### Total Estimate: 8-13 days
- Phase 1 (Backend): 2-3 days
- Phase 2 (Frontend): 2-3 days
- Phase 3 (Content): 3-5 days
- Phase 4 (Testing): 1-2 days

---

## Questions for Stakeholder

Before implementation, please confirm:

1. ✅ Approve configuration-based menu approach (not database-driven)?
2. ✅ Approve permission naming convention (dot notation: student.view, teacher.create)?
3. ✅ Approve 1-hour cache TTL for menus?
4. ✅ Which roles should we create initially? (super_admin, university_admin, teacher, student?)
5. ✅ Should we migrate all old HEMIS menu items or start with core features?
6. ✅ Any specific permission requirements for reporting modules?

---

**Document Version:** 1.0
**Created:** 2025-11-10
**Author:** Claude Code
**Status:** Ready for Review
