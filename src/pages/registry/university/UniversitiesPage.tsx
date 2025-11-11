import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UniversityDetailDrawer from './UniversityDetailDrawer';

export default function UniversitiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [regionId, setRegionId] = useState(searchParams.get('regionId') || '');
  const [ownershipId, setOwnershipId] = useState(searchParams.get('ownershipId') || '');
  const [typeId, setTypeId] = useState(searchParams.get('typeId') || '');

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

  const columns: ColumnDef<UniversityRow>[] = [
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedUniversity(row.original.code)}
          className="p-1.5 hover:bg-blue-50 rounded transition"
          title="Ko'rish"
        >
          <Eye className="w-4 h-4 text-blue-600" />
        </button>
      ),
      size: 50,
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
    },
    {
      accessorKey: 'address',
      header: t('table.university.address') || 'Manzil',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.address || ''}>
          {row.original.address}
        </div>
      ),
    },
    {
      accessorKey: 'region',
      header: t('table.university.region') || 'Viloyat',
    },
    {
      accessorKey: 'ownership',
      header: t('table.university.ownership') || 'Mulkchilik',
    },
    {
      accessorKey: 'universityType',
      header: t('table.university.orgType') || 'Tashkiliy turi',
    },
    {
      accessorKey: 'cadastre',
      header: t('table.university.cadastre') || 'Kadastr',
    },
    {
      accessorKey: 'versionType',
      header: t('table.university.versionType') || 'Versiya turi',
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
            className="text-blue-600 hover:underline"
          >
            {row.original.universityUrl}
          </a>
        ) : null,
    },
    {
      accessorKey: 'teacherUrl',
      header: t('table.university.urls.teacher') || "O'qituvchi URL",
    },
    {
      accessorKey: 'studentUrl',
      header: t('table.university.urls.student') || 'Talaba URL',
    },
    {
      accessorKey: 'uzbmbUrl',
      header: t('table.university.uzbmbUrl') || 'UZBMB URL',
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
    },
    {
      accessorKey: 'activityStatus',
      header: t('table.university.activityStatus') || 'Faollik statusi',
    },
    {
      accessorKey: 'belongsTo',
      header: t('table.university.belongsTo') || 'Tegishli',
    },
    {
      accessorKey: 'terrain',
      header: t('table.university.terrain') || 'Mahalla',
    },
    {
      accessorKey: 'mailAddress',
      header: t('table.university.mailAddress') || 'Pochta manzili',
    },
    {
      accessorKey: 'bankInfo',
      header: t('table.university.bankInfo') || 'Bank ma\'lumotlari',
    },
    {
      accessorKey: 'accreditationInfo',
      header: t('table.university.accreditationInfo') || 'Akkreditatsiya ma\'lumotlari',
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('page.universities.title') || 'Muassasalar (OTMlar)'}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {t('page.universities.subtitle') || 'Oliy ta\'lim muassasalari reestri'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadUniversities()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition-all shadow-sm text-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('actions.refresh') || 'Yangilash'}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition-all shadow-sm text-sm"
              >
                <Download className="w-4 h-4" />
                {t('actions.export') || 'Export'}
              </button>
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold transition-all shadow-sm text-sm"
              >
                <Settings2 className="w-4 h-4" />
                Ustunlar
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('filters.searchPlaceholder') || 'Kod, nom yoki INN bo\'yicha qidirish...'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
              >
                Qidirish
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
            >
              <Filter className="w-4 h-4" />
              Filtr
              {(regionId || ownershipId || typeId) && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {[regionId, ownershipId, typeId].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-3 gap-4">
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
                    <label key={column.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded"
                      />
                      <span>{column.columnDef.header?.toString() || column.id}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b-2 border-gray-300"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
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

      {/* Pagination */}
      <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Jami: <span className="font-semibold">{totalElements}</span> ta
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700">
            Sahifa {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
            className="ml-4 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

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

