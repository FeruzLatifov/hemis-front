import apiClient from './client'

export const passwordResetApi = {
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/api/v1/web/auth/forgot-password', { email })
  },

  async resetPassword(data: { token: string; password: string }): Promise<void> {
    await apiClient.post('/api/v1/web/auth/reset-password', data)
  },
}
