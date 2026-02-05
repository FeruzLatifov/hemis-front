import { http, HttpResponse } from 'msw'

const API_URL = 'http://localhost:8081'

export const handlers = [
  // Auth endpoints
  http.get(`${API_URL}/api/v1/web/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@hemis.uz',
        firstName: 'Test',
        lastName: 'User',
        role: 'SUPER_ADMIN',
        roleType: 'SYSTEM',
        permissions: ['VIEW_DASHBOARD', 'MANAGE_UNIVERSITIES'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    })
  }),

  http.post(`${API_URL}/api/v1/web/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string }

    if (body.username === 'admin' && body.password === 'admin123') {
      return HttpResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      })
    }

    return HttpResponse.json(
      { success: false, message: 'Invalid credentials', data: null },
      { status: 401 },
    )
  }),

  http.post(`${API_URL}/api/v1/web/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  }),

  // Universities endpoints
  http.get(`${API_URL}/api/v1/web/universities`, () => {
    return HttpResponse.json([
      {
        id: 1,
        code: 'TATU',
        name: 'Toshkent Axborot Texnologiyalari Universiteti',
        shortName: 'TATU',
        address: 'Toshkent',
        rectorName: 'Rektor Ismi',
        rectorPhone: '+998901234567',
        email: 'info@tatu.uz',
        website: 'https://tatu.uz',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        code: 'TDTU',
        name: 'Toshkent Davlat Texnika Universiteti',
        shortName: 'TDTU',
        address: 'Toshkent',
        rectorName: 'Rektor Ismi',
        rectorPhone: '+998901234568',
        email: 'info@tdtu.uz',
        website: 'https://tdtu.uz',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  http.get(`${API_URL}/api/v1/web/universities/:id`, ({ params }) => {
    const { id } = params

    return HttpResponse.json({
      id: Number(id),
      code: 'TATU',
      name: 'Toshkent Axborot Texnologiyalari Universiteti',
      shortName: 'TATU',
      address: 'Toshkent',
      rectorName: 'Rektor Ismi',
      rectorPhone: '+998901234567',
      email: 'info@tatu.uz',
      website: 'https://tatu.uz',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })
  }),

  // Dashboard endpoints
  http.get(`${API_URL}/api/v1/web/dashboard/stats`, () => {
    return HttpResponse.json({
      totalUniversities: 45,
      totalFaculties: 250,
      totalStudents: 150000,
      totalTeachers: 12000,
      activeUsers: 250,
    })
  }),

  // Translations endpoints
  http.get(`${API_URL}/api/v1/web/i18n/translations`, ({ request }) => {
    const url = new URL(request.url)
    const lang = url.searchParams.get('lang') || 'uz'

    return HttpResponse.json({
      Welcome: lang === 'uz' ? 'Xush kelibsiz' : 'Welcome',
      'Sign in': lang === 'uz' ? 'Kirish' : 'Sign in',
      'Sign out': lang === 'uz' ? 'Chiqish' : 'Sign out',
      Save: lang === 'uz' ? 'Saqlash' : 'Save',
      Cancel: lang === 'uz' ? 'Bekor qilish' : 'Cancel',
    })
  }),
]
