import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  VisibilityState,
} from '@tanstack/react-table';
import { universitiesApi, UniversityRow, Dictionary } from '@/api/universities.api';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FilterX,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UniversityDetailDrawer from './UniversityDetailDrawer';
import UniversityFormDialog from './UniversityFormDialog';
import { CustomTagFilter } from '@/components/filters/CustomTagFilter';
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
  type?: 'text' | 'select' | 'boolean';
  textValue?: string; // text type uchun
}

export default function UniversitiesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 0);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('size')) || 20);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(search);

  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const [dictionaries, setDictionaries] = useState<{
    regions: Dictionary[];
    ownerships: Dictionary[];
    types: Dictionary[];
  }>({ regions: [], ownerships: [], types: [] });

  const [horizontalFilters, setHorizontalFilters] = useState<HorizontalFilter[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const saved = localStorage.getItem('universities-column-visibility');
    return saved
      ? JSON.parse(saved)
      : {
          tin: true,
          address: true,
          region: true,
          ownership: true,
          universityType: true,
          cadastre: false,
          versionType: false,
          universityUrl: false,
          teacherUrl: false,
          studentUrl: false,
          uzbmbUrl: false,
          gpaEdit: false,
          accreditationEdit: false,
          addStudent: false,
          allowGrouping: false,
          allowTransferOutside: false,
          contractCategory: false,
          activityStatus: false,
          belongsTo: false,
          terrain: false,
          mailAddress: false,
          bankInfo: false,
          accreditationInfo: false,
        };
  });

  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<UniversityRow | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('universities-column-visibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const data = await universitiesApi.getUniversities({
        page: currentPage,
        size: pageSize,
        q: search || undefined,
        sort: 'name,asc',
      });

      setUniversities(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading universities:', error);
      toast.error(t('errors.loadFailed') || 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const loadDictionaries = async () => {
    try {
      const data = await universitiesApi.getDictionaries();
      setDictionaries(data);
    } catch (error) {
      console.error('Error loading dictionaries:', error);
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
    setSearchParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, search]);

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(0);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(0);
  };

  const handleExport = async () => {
    try {
      toast.info('Excel fayl tayyorlanmoqda...');
      await universitiesApi.exportUniversities({
        q: search || undefined,
      });
      toast.success('Export muvaffaqiyatli yakunlandi!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Exportda xatolik');
    }
  };

  const handleRemoveFilter = (filterKey: string) => {
    setHorizontalFilters(horizontalFilters.filter(f => f.key !== filterKey));
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearch('');
    setHorizontalFilters([]);
    setCurrentPage(0);
  };

  const getDictName = (items: Dictionary[], code?: string) => {
    if (!code) return undefined;
    const found = items.find((i) => i.code === code);
    return found?.name;
  };

  const handleCreate = () => {
    setEditingUniversity(null);
    setShowFormDialog(true);
  };

  const handleEdit = (university: UniversityRow) => {
    setEditingUniversity(university);
    setShowFormDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCode) return;
    
    try {
      await universitiesApi.deleteUniversity(deletingCode);
      toast.success('OTM muvaffaqiyatli o\'chirildi');
      loadUniversities();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTM o\'chirilmadi');
    } finally {
      setDeletingCode(null);
    }
  };

  const handleFormSuccess = () => {
    loadUniversities();
    setShowFormDialog(false);
    setEditingUniversity(null);
  };

  // Available horizontal filters - AdvancedFilterdan barcha propertylar
  const availableHorizontalFilters = [
    { key: 'region', label: 'Viloyat', data: dictionaries.regions },
    { key: 'ownership', label: 'Mulkchilik', data: dictionaries.ownerships },
    { key: 'type', label: 'Universitet turi', data: dictionaries.types },
    { 
      key: 'code', 
      label: 'Kod', 
      data: [], // Text input uchun
      type: 'text' as const
    },
    { 
      key: 'name', 
      label: 'Nomi', 
      data: [],
      type: 'text' as const
    },
    { 
      key: 'tin', 
      label: 'INN', 
      data: [],
      type: 'text' as const
    },
    { 
      key: 'address', 
      label: 'Manzil', 
      data: [],
      type: 'text' as const
    },
    { 
      key: 'cadastre', 
      label: 'Kadastr', 
      data: [],
      type: 'text' as const
    },
    { 
      key: 'gpaEdit', 
      label: 'GPA tahrir', 
      data: [
        { code: 'true', name: 'Ha' },
        { code: 'false', name: "Yo'q" }
      ],
      type: 'boolean' as const
    },
    { 
      key: 'active', 
      label: 'Faol', 
      data: [
        { code: 'true', name: 'Faol' },
        { code: 'false', name: 'Faol emas' }
      ],
      type: 'boolean' as const
    },
  ];

  const handleAddHorizontalFilter = (filterKey: string) => {
    const filter = availableHorizontalFilters.find(f => f.key === filterKey);
    if (!filter) return;
    
    if (!horizontalFilters.find(f => f.key === filterKey)) {
      setHorizontalFilters([...horizontalFilters, {
        key: filterKey,
        label: filter.label,
        selectedCodes: [],
      }]);
    }
  };

  const handleRemoveHorizontalFilter = (filterKey: string) => {
    setHorizontalFilters(horizontalFilters.filter(f => f.key !== filterKey));
  };

  const handleUpdateHorizontalFilter = (filterKey: string, codes: string[]) => {
    setHorizontalFilters(horizontalFilters.map(f => 
      f.key === filterKey ? { ...f, selectedCodes: codes } : f
    ));
  };

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
              setDeletingCode(row.original.code);
            }}
            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
      size: 140,
    },
    {
      accessorKey: 'code',
      header: t('table.university.code') || 'Kod',
      cell: ({ row }) => (
        <div className="font-medium text-blue-600">{row.original.code}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: t('table.university.name') || 'Nomi',
      cell: ({ row }) => (
        <div className="font-medium max-w-md truncate" title={row.original.name}>
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'tin',
      header: t('table.university.tin') || 'INN',
      cell: ({ row }) => row.original.tin || '-',
    },
    {
      accessorKey: 'address',
      header: t('table.university.address') || 'Manzil',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.address || ''}>
          {row.original.address || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'region',
      header: t('table.university.region') || 'Viloyat',
      cell: ({ row }) => {
        const code = row.original.regionCode || row.original.soatoRegion;
        const name = getDictName(dictionaries.regions, code);
        return name || row.original.region || '-';
      },
    },
    {
      accessorKey: 'ownership',
      header: t('table.university.ownership') || 'Mulkchilik',
      cell: ({ row }) => {
        const code = row.original.ownershipCode || (row.original.ownership as string | undefined);
        const name = getDictName(dictionaries.ownerships, code);
        return name || row.original.ownership || '-';
      },
    },
    {
      accessorKey: 'universityType',
      header: t('table.university.orgType') || 'Tashkiliy turi',
      cell: ({ row }) => {
        const code = row.original.universityTypeCode || (row.original.universityType as string | undefined);
        const name = getDictName(dictionaries.types, code);
        return name || row.original.universityType || '-';
      },
    },
    {
      accessorKey: 'cadastre',
      header: t('table.university.cadastre') || 'Kadastr',
      cell: ({ row }) => row.original.cadastre || '-',
    },
    {
      accessorKey: 'versionType',
      header: t('table.university.versionType') || 'Versiya turi',
      cell: ({ row }) => row.original.versionType || '-',
    },
    {
      accessorKey: 'universityUrl',
      header: t('table.university.urls.university') || 'OTM URL',
      cell: ({ row }) =>
        row.original.universityUrl ? (
          <a
            href={row.original.universityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-xs"
          >
            {row.original.universityUrl}
          </a>
        ) : '-',
    },
    {
      accessorKey: 'teacherUrl',
      header: t('table.university.urls.teacher') || "O'qituvchi URL",
      cell: ({ row }) => row.original.teacherUrl || '-',
    },
    {
      accessorKey: 'studentUrl',
      header: t('table.university.urls.student') || 'Talaba URL',
      cell: ({ row }) => row.original.studentUrl || '-',
    },
    {
      accessorKey: 'uzbmbUrl',
      header: t('table.university.uzbmbUrl') || 'UZBMB URL',
      cell: ({ row }) => row.original.uzbmbUrl || '-',
    },
    {
      accessorKey: 'gpaEdit',
      header: t('table.university.flags.gpaEdit') || 'GPA tahrir',
      cell: ({ row }) => (row.original.gpaEdit ? '✓' : ''),
    },
    {
      accessorKey: 'accreditationEdit',
      header: t('table.university.flags.accreditationEdit') || 'Akkreditatsiya tahrir',
      cell: ({ row }) => (row.original.accreditationEdit ? '✓' : ''),
    },
    {
      accessorKey: 'addStudent',
      header: t('table.university.flags.addStudent') || 'Talaba qo\'shish',
      cell: ({ row }) => (row.original.addStudent ? '✓' : ''),
    },
    {
      accessorKey: 'allowGrouping',
      header: t('table.university.flags.allowGrouping') || 'Guruhlashga ruxsat',
      cell: ({ row }) => (row.original.allowGrouping ? '✓' : ''),
    },
    {
      accessorKey: 'allowTransferOutside',
      header: t('table.university.flags.allowTransferOutside') || "Tashqariga o'tkazishga ruxsat",
      cell: ({ row }) => (row.original.allowTransferOutside ? '✓' : ''),
    },
    {
      accessorKey: 'contractCategory',
      header: t('table.university.contractCategory') || 'Kontrakt kategoriyasi',
      cell: ({ row }) => row.original.contractCategory || '-',
    },
    {
      accessorKey: 'activityStatus',
      header: t('table.university.activityStatus') || 'Faollik statusi',
      cell: ({ row }) => row.original.activityStatus || '-',
    },
    {
      accessorKey: 'belongsTo',
      header: t('table.university.belongsTo') || 'Tegishli',
      cell: ({ row }) => row.original.belongsTo || '-',
    },
    {
      accessorKey: 'terrain',
      header: t('table.university.terrain') || 'Mahalla',
      cell: ({ row }) => row.original.terrain || '-',
    },
    {
      accessorKey: 'mailAddress',
      header: t('table.university.mailAddress') || 'Pochta manzili',
      cell: ({ row }) => row.original.mailAddress || '-',
    },
    {
      accessorKey: 'bankInfo',
      header: t('table.university.bankInfo') || 'Bank ma\'lumotlari',
      cell: ({ row }) => row.original.bankInfo || '-',
    },
    {
      accessorKey: 'accreditationInfo',
      header: t('table.university.accreditationInfo') || 'Akkreditatsiya ma\'lumotlari',
      cell: ({ row }) => row.original.accreditationInfo || '-',
    },
  ];

  const table = useReactTable({
    data: universities,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Card - stat-ministry style */}
      <div className="p-3">
        <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Muassasalar ro'yxati</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Qo'shish
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => loadUniversities()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Yangilash
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Zone - stat-ministry style with TableContainerWithFilter look */}
      <div className="px-3 pb-3">
        <div className="rounded-lg bg-white shadow-sm border border-gray-100">
          {/* Filter Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Filtrlar</h3>
            <div className="flex items-center gap-2">
              {/* Filter Button - Chap tomonda */}
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  showFiltersPanel
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                {horizontalFilters.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-blue-600 rounded-full">
                    {horizontalFilters.length}
                  </span>
                )}
              </button>
              {/* Search Input - O'ng tomonda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kod, nom yoki INN bo'yicha qidirish..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-96 pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Content */}
          {showFiltersPanel && (
            <div className="p-4 bg-gray-50/50">
              {/* Horizontal Filters (chip-like buttons) */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {availableHorizontalFilters
                    .filter(f => !horizontalFilters.find(hf => hf.key === f.key))
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
              </div>

              {/* Selected Horizontal Filters as Interactive Chips */}
              {horizontalFilters.length > 0 && (
                <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {horizontalFilters.map((filter) => {
                      const filterData = availableHorizontalFilters.find(f => f.key === filter.key);
                      if (!filterData) return null;
                      
                      // Text type filters (future: need input popover)
                      if (filterData.type === 'text') {
                        return (
                          <div key={filter.key} className="flex items-center gap-2 rounded-lg bg-gray-200 p-2">
                            <span className="text-sm font-medium text-gray-700">
                              {filter.label}
                              {filter.textValue && (
                                <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                  ✓
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => handleRemoveHorizontalFilter(filter.key)}
                              className="cursor-pointer rounded-full bg-red-50 p-1 text-red-500 hover:bg-red-100 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      }
                      
                      // Select/Boolean type filters with CustomTagFilter
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {(horizontalFilters.length > 0 || search) && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <FilterX className="w-4 h-4" />
                    Tozalash
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="px-3 pb-3">
        <div className="rounded-lg bg-white shadow-sm border border-gray-100">
          {/* Table Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Jami: <span className="font-bold text-gray-900">{totalElements}</span> ta
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-600">
                Sahifa: <span className="font-bold text-gray-900">{currentPage + 1}</span> / {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                Ustunlar
              </button>
            </div>
          </div>

          {/* Column Settings */}
          {showColumnSettings && (
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold mb-3 text-sm">Ustunlarni boshqarish</h3>
              <div className="grid grid-cols-4 gap-2">
                {table.getAllLeafColumns().map((column) => {
                  if (column.id === 'actions') return null;
                  return (
                    <label key={column.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded cursor-pointer"
                      />
                      <span className="flex-1">{column.columnDef.header?.toString() || column.id}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      if (header.isPlaceholder || !header.column.getIsVisible()) {
                        return null;
                      }
                      return (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                        Yuklanmoqda...
                      </div>
                    </td>
                  </tr>
                ) : universities.length === 0 ? (
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length} className="px-4 py-8 text-center text-gray-500">
                      Ma'lumotlar topilmadi
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedUniversity(row.original.code)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 ta</option>
                <option value={20}>20 ta</option>
                <option value={50}>50 ta</option>
                <option value={100}>100 ta</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Sahifa
                </span>
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-sm font-bold">
                  {currentPage + 1}
                </span>
                <span className="text-sm text-gray-500">
                  / {totalPages}
                </span>
              </div>
              
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <UniversityFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        university={editingUniversity}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCode} onOpenChange={() => setDeletingCode(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-bold text-gray-900">
              OTM o'chirish
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 mt-3 text-base">
              Haqiqatan ham bu oliy ta'lim muassasasini o'chirmoqchimisiz? 
              <br />
              <span className="font-semibold text-gray-900 mt-2 inline-block">
                Bu amal qaytarilmaydi!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
            <AlertDialogCancel className="flex-1 py-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-all">
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Drawer */}
      {selectedUniversity && (
        <UniversityDetailDrawer
          universityId={selectedUniversity}
          onClose={() => setSelectedUniversity(null)}
        />
      )}
    </div>
  );
}
