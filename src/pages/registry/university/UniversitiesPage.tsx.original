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
import AdvancedFilter, { FilterProperty, FilterCondition } from '@/components/common/AdvancedFilter';
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

  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [regionId, setRegionId] = useState(searchParams.get('regionId') || '');
  const [ownershipId, setOwnershipId] = useState(searchParams.get('ownershipId') || '');
  const [typeId, setTypeId] = useState(searchParams.get('typeId') || '');
  const [advancedConditions, setAdvancedConditions] = useState<FilterCondition[]>([]);

  const [dictionaries, setDictionaries] = useState<{
    regions: Dictionary[];
    ownerships: Dictionary[];
    types: Dictionary[];
  }>({ regions: [], ownerships: [], types: [] });

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
        regionId: regionId || undefined,
        ownershipId: ownershipId || undefined,
        typeId: typeId || undefined,
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
    if (regionId) params.regionId = regionId;
    if (ownershipId) params.ownershipId = ownershipId;
    if (typeId) params.typeId = typeId;
    setSearchParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, search, regionId, ownershipId, typeId]);

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
        regionId: regionId || undefined,
        ownershipId: ownershipId || undefined,
        typeId: typeId || undefined,
      });
      toast.success('Export muvaffaqiyatli yakunlandi!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Exportda xatolik');
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(0);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setRegionId('');
    setOwnershipId('');
    setTypeId('');
    setCurrentPage(0);
    setShowFilters(false);
  };

  const getDictName = (items: Dictionary[], code?: string) => {
    if (!code) return undefined;
    const found = items.find((i) => i.code === code);
    return found?.name;
  };

  const filterProperties: FilterProperty[] = [
    { key: 'code', label: t('table.university.code') || 'Kod', type: 'text' },
    { key: 'name', label: t('table.university.name') || 'Nomi', type: 'text' },
    { key: 'tin', label: t('table.university.tin') || 'INN', type: 'text' },
    { key: 'address', label: t('table.university.address') || 'Manzil', type: 'text' },
    { 
      key: 'region', 
      label: t('table.university.region') || 'Viloyat', 
      type: 'select',
      options: dictionaries.regions.map(r => ({ value: r.code, label: r.name }))
    },
    { 
      key: 'ownership', 
      label: t('table.university.ownership') || 'Mulkchilik', 
      type: 'select',
      options: dictionaries.ownerships.map(o => ({ value: o.code, label: o.name }))
    },
    { 
      key: 'universityType', 
      label: t('table.university.orgType') || 'Tashkiliy turi', 
      type: 'select',
      options: dictionaries.types.map(t => ({ value: t.code, label: t.name }))
    },
    { key: 'cadastre', label: t('table.university.cadastre') || 'Kadastr', type: 'text' },
    { key: 'gpaEdit', label: t('table.university.flags.gpaEdit') || 'GPA tahrir', type: 'boolean' },
    { key: 'active', label: 'Active', type: 'boolean' },
  ];

  const handleApplyAdvancedFilters = (conditions: FilterCondition[]) => {
    setAdvancedConditions(conditions);
    setCurrentPage(0);
    setShowAdvancedFilters(false);
    
    toast.success(`${conditions.length} ta filter qo'llandi`);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedConditions([]);
    setCurrentPage(0);
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
            className="group relative p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all duration-200 hover:shadow-md"
            title="Ko'rish"
          >
            <Eye className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Ko'rish
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original);
            }}
            className="group relative p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-all duration-200 hover:shadow-md"
            title="Tahrirlash"
          >
            <Edit className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Tahrirlash
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingCode(row.original.code);
            }}
            className="group relative p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-all duration-200 hover:shadow-md"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              O'chirish
            </span>
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with gradient */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">
                {t('page.universities.title') || 'Oliy Ta\'lim Muassasalari'}
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {totalElements} ta universitet
                </span>
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold">Yangi OTM Qo'shish</span>
            </button>
          </div>
          {/* Action Buttons Row */}
          <div className="flex gap-3">
            <button
              onClick={() => loadUniversities()}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('actions.refresh') || 'Yangilash'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              {t('actions.export') || 'Eksport'}
            </button>
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Settings2 className="w-4 h-4" />
              Ustunlar
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 mt-4 px-6 pb-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('filters.searchPlaceholder') || 'Kod, nom yoki INN bo\'yicha qidirish...'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Qidirish
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
                regionId || ownershipId || typeId
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtrlar
              {(regionId || ownershipId || typeId) && (
                <span className="ml-1 px-2 py-0.5 bg-white text-orange-600 rounded-full text-xs font-bold">
                  {[regionId, ownershipId, typeId].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition border ${
                advancedConditions.length > 0
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              Qidiruv shartlari
              {advancedConditions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white text-blue-600 text-xs rounded-full font-bold">
                  {advancedConditions.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filters */}
          {showFilters && (
            <div className="mt-2 p-3 bg-gray-50 rounded border">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('filters.region') || 'Viloyat'}
                  </label>
                  <select
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Barchasi</option>
                    {dictionaries.regions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('filters.ownership') || 'Mulkchilik'}
                  </label>
                  <select
                    value={ownershipId}
                    onChange={(e) => setOwnershipId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Barchasi</option>
                    {dictionaries.ownerships.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('filters.type') || 'Turi'}
                  </label>
                  <select
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Barchasi</option>
                    {dictionaries.types.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Tozalash
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
                >
                  Qo'llash
                </button>
              </div>
            </div>
          )}

          {/* Column Settings */}
          {showColumnSettings && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-semibold mb-3">Ustunlarni boshqarish</h3>
              <div className="grid grid-cols-4 gap-3">
                {table.getAllLeafColumns().map((column) => {
                  if (column.id === 'actions') return null;
                    return (
                      <label key={column.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
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

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-2 max-h-80 overflow-auto">
              <AdvancedFilter
                properties={filterProperties}
                onApply={handleApplyAdvancedFilters}
                onClear={handleClearAdvancedFilters}
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="min-w-full inline-block align-middle h-full">
          <table className="min-w-full divide-y divide-gray-200 h-full">
            <thead className="bg-gray-100 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    if (header.isPlaceholder || !header.column.getIsVisible()) {
                      return null;
                    }

                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b-2 border-gray-300"
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
                    Yuklanmoqda...
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
                    className="hover:bg-gray-50 cursor-pointer transition"
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
      </div>

      {/* Modern Pagination */}
      <div className="bg-white border-t-2 border-gray-200 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Jami:
          </span>
          <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
            {totalElements} ta universitet
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-white transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border-2 border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              Sahifa
            </span>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md font-bold text-sm shadow-sm">
              {currentPage + 1}
            </span>
            <span className="text-sm text-gray-500">
              / {totalPages}
            </span>
          </div>
          
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-lg bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-white transition-all"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium text-gray-700 hover:border-blue-400 transition-all cursor-pointer"
          >
            <option value={10}>10 ta</option>
            <option value={20}>20 ta</option>
            <option value={50}>50 ta</option>
            <option value={100}>100 ta</option>
          </select>
        </div>
      </div>

      {/* Form Dialog */}
      <UniversityFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        university={editingUniversity}
        onSuccess={handleFormSuccess}
      />

      {/* Modern Delete Confirmation Dialog */}
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
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
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

