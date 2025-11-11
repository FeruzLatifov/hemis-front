/**
 * Translation Admin Page - Compact Modern Design
 *
 * View and Edit system translations (No Create/Delete)
 * Path: Tizim → Tarjimalar
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTranslations,
  toggleTranslationActive,
  clearTranslationCache,
  regeneratePropertiesFiles,
  Translation,
} from '../../../api/translations.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Filter, Trash2, FileCode, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function TranslationsPage() {
  const navigate = useNavigate();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();

  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const loadTranslations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getTranslations({
        category: categoryFilter || undefined,
        search: searchFilter || undefined,
        active: activeFilter,
        page: currentPage,
        size: pageSize,
        sortBy: 'category',
        sortDir: 'ASC',
      });

      setTranslations(Array.isArray(response.content) ? response.content : []);
      setCurrentPage(response.currentPage ?? 0);
      setTotalItems(response.totalItems ?? 0);
      setTotalPages(response.totalPages ?? 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load translations');
      console.error('Error loading translations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranslations();
  }, [currentPage, pageSize, categoryFilter, searchFilter, activeFilter]);

  const handleToggleActive = async (id: string) => {
    try {
      await toggleTranslationActive(id);
      loadTranslations();
    } catch (err: any) {
      alert('Failed to toggle active status: ' + err.message);
    }
  };

  const confirmClearCache = async () => {
    try {
      const result = await clearTranslationCache();
      setShowClearCacheModal(false);
      toast.success(result.message || 'Cache muvaffaqiyatli tozalandi', {
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (err: any) {
      toast.error('❌ Cache tozalashda xatolik: ' + err.message, {
        duration: 5000,
        position: 'bottom-right',
      });
    }
  };

  const confirmRegenerateFiles = async () => {
    try {
      const result = await regeneratePropertiesFiles();
      setShowRegenerateModal(false);
      toast.success(`✓ ${result.totalFiles} ta fayl yaratildi (${result.totalTranslations} tarjima)`, {
        duration: 4000,
        position: 'bottom-right',
      });
    } catch (err: any) {
      toast.error('❌ Properties yaratishda xatolik: ' + err.message, {
        duration: 5000,
        position: 'bottom-right',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* Sticky Header + Filters */}
      <div className="sticky top-0 z-30 shadow-md" style={{ backgroundColor: 'var(--card-bg)', borderBottom: '2px solid var(--border-color-pro)' }}>
        <div className="px-6 py-4">
          {/* Title + Actions */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Tarjimalarni boshqarish
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Tarjimalar (i18n) kalit-matn juftliklarini ko'rish va tahrirlash
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearCacheModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold transition-all shadow-sm text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Cache tozalash
              </button>
              <button
                onClick={() => setShowRegenerateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold transition-all shadow-sm text-sm"
              >
                <FileCode className="w-4 h-4" />
                Properties yaratish
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Filter className="inline-block w-3 h-3 mr-1" />
                Kategoriya
              </label>
              <input
                type="text"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                placeholder="menu, button..."
                className="w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  borderColor: 'var(--border-color-pro)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Search className="inline-block w-3 h-3 mr-1" />
                Qidiruv
              </label>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Kalit yoki matn..."
                className="w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  borderColor: 'var(--border-color-pro)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Holat
              </label>
              <select
                value={activeFilter === undefined ? '' : activeFilter ? 'true' : 'false'}
                onChange={(e) => setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  borderColor: 'var(--border-color-pro)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Barchasi</option>
                <option value="true">Aktiv</option>
                <option value="false">Faol emas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Ko'rsatish
              </label>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
                className="w-full px-3 py-2 border rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  borderColor: 'var(--border-color-pro)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container with Scrollable Body */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="h-full flex flex-col rounded-lg shadow-lg border overflow-hidden" style={{ 
          borderColor: 'var(--border-color-pro)',
          backgroundColor: 'var(--card-bg)'
        }}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: 'var(--primary)' }}></div>
                <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Yuklanmoqda...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-semibold" style={{ color: 'var(--danger)' }}>Xato: {error}</p>
            </div>
          ) : translations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Hech qanday tarjima topilmadi</p>
            </div>
          ) : (
            <>
              {/* Scrollable Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  {/* Sticky Table Header */}
                  <thead className="sticky top-0 z-10" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Kategoriya</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Kalit</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Matn (uz)</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wide">Holat</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wide">Amallar</th>
                    </tr>
                  </thead>
                  {/* Table Body */}
                  <tbody>
                    {translations.map((translation, index) => (
                      <tr
                        key={translation.id}
                        className="transition-colors border-b"
                        style={{
                          borderColor: 'var(--border-color-pro)',
                          backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(102, 126, 234, 0.02)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--active-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(102, 126, 234, 0.02)';
                        }}
                      >
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm" style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white'
                          }}>
                            {translation.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {translation.messageKey}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {translation.message}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleActive(translation.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              translation.isActive
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                          >
                            {translation.isActive ? '✓' : '○'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigate(`/system/translation/${translation.id}/edit`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:shadow-md"
                            style={{ backgroundColor: 'var(--primary)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--primary)';
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Tahrirlash
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sticky Pagination Footer */}
              <div className="sticky bottom-0 px-4 py-3 border-t flex items-center justify-between" style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color-pro)',
                boxShadow: '0 -1px 4px rgba(0,0,0,0.05)'
              }}>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <span className="px-2.5 py-1 rounded-md font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>
                    {totalItems}
                  </span>
                  <span>ta</span>
                  <span className="mx-1" style={{ color: 'var(--text-secondary)' }}>•</span>
                  <span>Sahifa</span>
                  <span className="px-2.5 py-1 rounded-md font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>
                    {currentPage + 1}
                  </span>
                  <span>/</span>
                  <span>{totalPages}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md"
                    style={{
                      borderColor: currentPage === 0 ? 'var(--border-color-pro)' : 'var(--primary)',
                      backgroundColor: 'var(--card-bg)',
                      color: currentPage === 0 ? 'var(--text-secondary)' : 'var(--primary)'
                    }}
                  >
                    ← Oldingi
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md"
                    style={{
                      borderColor: currentPage >= totalPages - 1 ? 'var(--border-color-pro)' : 'var(--primary)',
                      backgroundColor: 'var(--card-bg)',
                      color: currentPage >= totalPages - 1 ? 'var(--text-secondary)' : 'var(--primary)'
                    }}
                  >
                    Keyingi →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clear Cache Modal */}
      <Dialog open={showClearCacheModal} onOpenChange={setShowClearCacheModal}>
        <DialogContent className="bg-white dark:bg-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-yellow-500" />
              Cache tozalash
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
              Tarjimalar cache'ini tozalamoqchimisiz? Bu amal backenddan tarjimalarni qayta yuklashga majbur qiladi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <button
              onClick={() => setShowClearCacheModal(false)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
            >
              Bekor qilish
            </button>
            <button
              onClick={confirmClearCache}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Ha, tozalash
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Properties Modal */}
      <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
        <DialogContent className="bg-white dark:bg-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileCode className="w-6 h-6 text-purple-500" />
              Properties fayllarini qayta yaratish
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
              Barcha tillar uchun properties fayllarini qayta yaratmoqchimisiz? Bu amal bir necha soniya davom etishi mumkin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <button
              onClick={() => setShowRegenerateModal(false)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
            >
              Bekor qilish
            </button>
            <button
              onClick={confirmRegenerateFiles}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Ha, yaratish
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
