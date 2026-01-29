import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { universitiesApi, UniversityRow, Dictionary, UniversitiesParams } from '@/api/universities.api';

/**
 * Extended params type for university search including all scope fields
 */
interface UniversitySearchParams extends UniversitiesParams {
  code?: string;
  name?: string;
  tin?: string;
  address?: string;
  cadastre?: string;
  [key: string]: string | number | undefined;
}
import { toast } from 'sonner';
import { extractApiErrorMessage } from '@/utils/error.util';
import {
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilterX,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UniversityDetailDrawer from './UniversityDetailDrawer';
import UniversityFormDialog from './UniversityFormDialog';
import { CustomTagFilter } from '@/components/filters/CustomTagFilter';
import { SearchScopeSelector } from '@/components/filters/SearchScopeSelector';
import { ColumnSettingsPopover } from '@/components/filters/ColumnSettingsPopover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HorizontalFilter {
  key: string;
  label: string;
  selectedCodes: string[];
}

export default function UniversitiesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data state
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 0);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('size')) || 20);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(search);
  const [searchScope, setSearchScope] = useState(searchParams.get('scope') || 'all');

  // UI State
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [dictionaries, setDictionaries] = useState<{
    regions: Dictionary[];
    ownerships: Dictionary[];
    types: Dictionary[];
  }>({ regions: [], ownerships: [], types: [] });

  // Filters
  const [horizontalFilters, setHorizontalFilters] = useState<HorizontalFilter[]>([]);

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const saved = localStorage.getItem('universities-column-visibility');
    return saved ? JSON.parse(saved) : {};
  });

  // Dialogs
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<UniversityRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; code: string | null }>({
    show: false,
    code: null,
  });

  // Search scopes
  const searchScopes = [
    { value: 'all', label: 'Hamma' },
    { value: 'code', label: 'Kod' },
    { value: 'name', label: 'Nomi' },
    { value: 'tin', label: 'INN' },
    { value: 'address', label: 'Manzil' },
    { value: 'cadastre', label: 'Kadastr' },
  ];

  // Available filters
  const availableHorizontalFilters = [
    { key: 'region', label: 'Viloyat', data: dictionaries.regions },
    { key: 'ownership', label: 'Mulkchilik', data: dictionaries.ownerships },
    { key: 'type', label: 'Universitet turi', data: dictionaries.types },
    {
      key: 'gpaEdit',
      label: 'GPA tahrir',
      data: [
        { code: 'true', name: 'Ha' },
        { code: 'false', name: "Yo'q" },
      ],
      type: 'boolean' as const,
    },
    {
      key: 'active',
      label: 'Faol',
      data: [
        { code: 'true', name: 'Faol' },
        { code: 'false', name: 'Faol emas' },
      ],
      type: 'boolean' as const,
    },
  ];

  // Load data
  const loadUniversities = async () => {
    try {
      setLoading(true);

      const params: UniversitySearchParams = {
        page: currentPage,
        size: pageSize,
        sort: 'name,asc',
      };

      if (search) {
        if (searchScope === 'all') {
          params.q = search;
        } else {
          params[searchScope] = search;
        }
      }

      const data = await universitiesApi.getUniversities(params);

      setUniversities(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (error) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(error, t('Failed to load data')));
    } finally {
      setLoading(false);
    }
  };

  const loadDictionaries = async () => {
    try {
      const data = await universitiesApi.getDictionaries();
      setDictionaries(data);
    } catch {
      // Dictionaries load silently - error handling not critical
    }
  };

  useEffect(() => {
    loadDictionaries();
  }, []);

  useEffect(() => {
    loadUniversities();

    const params: Record<string, string> = {};
    if (currentPage > 0) params.page = String(currentPage);
    if (pageSize !== 20) params.size = String(pageSize);
    if (search) params.q = search;
    if (searchScope !== 'all') params.scope = searchScope;
    setSearchParams(params);
  }, [currentPage, pageSize, search, searchScope]);

  useEffect(() => {
    localStorage.setItem('universities-column-visibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  // Handlers
  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(0);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(0);
  };

  const handleRefresh = () => {
    loadUniversities();
    toast.success('Ma\'lumotlar yangilandi');
  };

  const handleExport = async () => {
    try {
      await universitiesApi.exportUniversities({});
      toast.success('Excel fayl yuklanmoqda...');
    } catch (error) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(error, 'Eksport qilishda xatolik'));
    }
  };

  const handleClearFilters = () => {
    setHorizontalFilters([]);
    setSearchInput('');
    setSearch('');
    setSearchScope('all');
    setCurrentPage(0);
  };

  const handleAddHorizontalFilter = (filterKey: string) => {
    const filter = availableHorizontalFilters.find((f) => f.key === filterKey);
    if (!filter) return;

    if (!horizontalFilters.find((f) => f.key === filterKey)) {
      setHorizontalFilters([
        ...horizontalFilters,
        {
          key: filterKey,
          label: filter.label,
          selectedCodes: [],
        },
      ]);
    }
  };

  const handleRemoveHorizontalFilter = (filterKey: string) => {
    setHorizontalFilters(horizontalFilters.filter((f) => f.key !== filterKey));
  };

  const handleUpdateHorizontalFilter = (filterKey: string, codes: string[]) => {
    setHorizontalFilters(
      horizontalFilters.map((f) => (f.key === filterKey ? { ...f, selectedCodes: codes } : f))
    );
  };

  const handleDelete = async (code: string) => {
    try {
      await universitiesApi.deleteUniversity(code);
      toast.success(t('Successfully deleted'));
      loadUniversities();
    } catch (error) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(error, t('Failed to delete')));
    } finally {
      setDeleteConfirm({ show: false, code: null });
    }
  };

  const handleEdit = (university: UniversityRow) => {
    setEditingUniversity(university);
    setShowFormDialog(true);
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setEditingUniversity(null);
    loadUniversities();
  };

  const handleFormCancel = () => {
    setShowFormDialog(false);
    setEditingUniversity(null);
  };

  // Table columns
  const columns: ColumnDef<UniversityRow>[] = [
    {
      id: 'actions',
      header: () => <div className="text-center">Amallar</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUniversity(row.original.code);
            }}
            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            title="Ko'rish"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original);
            }}
            className="p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
            title="Tahrirlash"
          >
            <Edit className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm({ show: true, code: row.original.code });
            }}
            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
      size: 150,
      enableHiding: false,
    },
    {
      accessorKey: 'code',
      header: 'Kod',
      size: 100,
    },
    {
      accessorKey: 'name',
      header: 'Nomi',
      size: 300,
    },
    {
      accessorKey: 'tin',
      header: 'INN',
      size: 120,
    },
    {
      accessorKey: 'region',
      header: 'Viloyat',
      size: 150,
    },
    {
      accessorKey: 'ownership',
      header: 'Mulkchilik',
      size: 150,
    },
    {
      accessorKey: 'type',
      header: 'Turi',
      size: 150,
    },
    {
      accessorKey: 'address',
      header: 'Manzil',
      size: 250,
    },
    {
      accessorKey: 'cadastre',
      header: 'Kadastr',
      size: 150,
    },
    {
      accessorKey: 'active',
      header: 'Holat',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            row.original.active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.original.active ? 'Faol' : 'Faol emas'}
        </span>
      ),
      size: 100,
    },
  ];

  const table = useReactTable({
    data: universities,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-3">
      {/* Container - stat-ministry style */}
      <div className="bg-white rounded-lg p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xl font-bold text-gray-800">Muassasalar ro'yxati</h3>
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                showFiltersPanel
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              {horizontalFilters.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-blue-600 rounded-full">
                  {horizontalFilters.length}
                </span>
              )}
            </button>

            {/* Search Scope Selector */}
            <SearchScopeSelector
              value={searchScope}
              onChange={setSearchScope}
              scopes={searchScopes}
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />

            {/* Add Button */}
            <button
              onClick={() => setShowFormDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Qo'shish
            </button>

            {/* Excel Button */}
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>

            {/* Column Settings Popover */}
            <ColumnSettingsPopover
              columns={table.getAllLeafColumns()
                .filter(col => col.id !== 'actions')
                .map(col => ({
                  id: col.id,
                  label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
                  visible: col.getIsVisible(),
                  canHide: col.id !== 'actions',
                }))}
              onToggle={(columnId) => {
                const column = table.getColumn(columnId);
                if (column) {
                  column.toggleVisibility();
                }
              }}
            />
          </div>
        </div>

        {/* Filters Panel - stat-ministry style */}
        {showFiltersPanel && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            {/* Add Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {availableHorizontalFilters
                .filter((f) => !horizontalFilters.find((hf) => hf.key === f.key))
                .map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleAddHorizontalFilter(filter.key)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + {filter.label}
                  </button>
                ))}
            </div>

            {/* Active Filters */}
            {horizontalFilters.length > 0 && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {horizontalFilters.map((filter) => {
                    const filterData = availableHorizontalFilters.find(
                      (f) => f.key === filter.key
                    );
                    if (!filterData) return null;

                    return (
                      <CustomTagFilter
                        key={filter.key}
                        label={filter.label}
                        data={filterData.data}
                        value={filter.selectedCodes}
                        onChange={(codes) => handleUpdateHorizontalFilter(filter.key, codes)}
                        onClose={() => handleRemoveHorizontalFilter(filter.key)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear Filters & Refresh */}
            {(horizontalFilters.length > 0 || search) && (
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FilterX className="w-4 h-4" />
                  Tozalash
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Yangilash
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table Info */}
        <div className="flex items-center justify-between px-1 py-2 text-sm text-gray-600">
          <div>
            Jami: <span className="font-semibold">{totalElements}</span> ta
          </div>
          <div>
            Sahifa: <span className="font-semibold">{currentPage + 1}</span> /{' '}
            <span className="font-semibold">{totalPages || 1}</span>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : universities.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Sahifada:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1.5 text-sm text-gray-700">
              {currentPage + 1} / {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <UniversityDetailDrawer
        code={selectedUniversity}
        open={!!selectedUniversity}
        onClose={() => setSelectedUniversity(null)}
      />

      {/* Form Dialog */}
      <UniversityFormDialog
        open={showFormDialog}
        university={editingUniversity}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, code: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Universiterni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu universiterni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm.code && handleDelete(deleteConfirm.code)}
              className="bg-red-600 hover:bg-red-700"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
