/**
 * Tests for Faculties API Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import apiClient from '@/api/client'
import { facultiesApi } from '@/api/faculties.api'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>

const BASE_URL = '/api/v1/web/registry/faculties'

describe('facultiesApi.getGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls correct URL with params', async () => {
    const pageData = {
      content: [
        {
          universityCode: 'TATU',
          universityName: 'TATU',
          facultyCount: 10,
          activeFacultyCount: 8,
          inactiveFacultyCount: 2,
          hasChildren: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    }

    mockGet.mockResolvedValueOnce({ data: { success: true, data: pageData } })

    const params = { q: 'TATU', page: 0, size: 10 }
    const result = await facultiesApi.getGroups(params)

    expect(mockGet).toHaveBeenCalledWith(`${BASE_URL}/groups`, { params })
    expect(result.content).toHaveLength(1)
    expect(result.content[0].universityCode).toBe('TATU')
  })

  it('passes status filter param', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 },
      },
    })

    const params = { status: true, page: 0, size: 20 }
    await facultiesApi.getGroups(params)

    expect(mockGet).toHaveBeenCalledWith(`${BASE_URL}/groups`, { params })
  })
})

describe('facultiesApi.getFacultiesByUniversity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls correct URL with universityId and params', async () => {
    const pageData = {
      content: [
        {
          code: 'FAC001',
          nameUz: 'Informatika fakulteti',
          universityCode: 'TATU',
          universityName: 'TATU',
          status: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    }

    mockGet.mockResolvedValueOnce({ data: { success: true, data: pageData } })

    const params = { q: 'Informatika', page: 0, size: 10 }
    const result = await facultiesApi.getFacultiesByUniversity('TATU', params)

    expect(mockGet).toHaveBeenCalledWith(`${BASE_URL}/by-university/TATU`, { params })
    expect(result.content).toHaveLength(1)
    expect(result.content[0].code).toBe('FAC001')
  })
})

describe('facultiesApi.getFacultyDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls correct URL and returns detail', async () => {
    const detail = {
      code: 'FAC001',
      nameUz: 'Informatika fakulteti',
      nameRu: 'Fakultet informatiki',
      universityCode: 'TATU',
      universityName: 'TATU',
      status: true,
      departmentType: 'FACULTY',
      departmentTypeName: 'Fakultet',
    }

    mockGet.mockResolvedValueOnce({ data: { success: true, data: detail } })

    const result = await facultiesApi.getFacultyDetail('FAC001')

    expect(mockGet).toHaveBeenCalledWith(`${BASE_URL}/FAC001`)
    expect(result.code).toBe('FAC001')
    expect(result.nameUz).toBe('Informatika fakulteti')
  })
})

describe('facultiesApi.getDictionaries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls correct URL and returns dictionaries', async () => {
    const dictionaries = {
      statuses: [
        { value: true, labelKey: 'active' },
        { value: false, labelKey: 'inactive' },
      ],
    }

    mockGet.mockResolvedValueOnce({ data: { success: true, data: dictionaries } })

    const result = await facultiesApi.getDictionaries()

    expect(mockGet).toHaveBeenCalledWith(`${BASE_URL}/dictionaries`)
    expect(result.statuses).toHaveLength(2)
    expect(result.statuses[0].value).toBe(true)
  })
})

describe('facultiesApi.exportFaculties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls POST with params and blob responseType', async () => {
    const blob = new Blob(['test'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    mockPost.mockResolvedValueOnce({ data: blob })

    const params = { q: 'TATU', status: true }
    const result = await facultiesApi.exportFaculties(params)

    expect(mockPost).toHaveBeenCalledWith(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    expect(result).toBeInstanceOf(Blob)
  })

  it('passes universityCode filter', async () => {
    const blob = new Blob(['test'])
    mockPost.mockResolvedValueOnce({ data: blob })

    const params = { universityCode: 'TATU' }
    await facultiesApi.exportFaculties(params)

    expect(mockPost).toHaveBeenCalledWith(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
  })
})
