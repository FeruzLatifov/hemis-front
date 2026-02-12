import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import apiClient from '@/api/client'
import { extractApiErrorMessage } from '@/utils/error.util'

export function useClearCache() {
  const { t } = useTranslation()
  const [isClearingCache, setIsClearingCache] = useState(false)

  const clearCache = async () => {
    setIsClearingCache(true)
    try {
      const response = await apiClient.post('/api/v1/web/auth/cache/clear')
      if (response.data?.success) {
        toast.success(t('Cache cleared'), {
          description: t('Permissions and translations updated. Page reloading...'),
          duration: 2000,
        })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast.error(response.data?.message || t('Error clearing cache'))
      }
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, t('Error clearing cache')))
    } finally {
      setIsClearingCache(false)
    }
  }

  return { isClearingCache, clearCache }
}
