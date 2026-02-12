import apiClient from '@/api/client'
import { universitiesApi } from '@/api/universities.api'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Minimal snake_case DTO as the CUBA legacy backend would return */
function snakeCaseDTO(overrides = {}) {
  return {
    code: 'TATU',
    name: 'TATU University',
    tin: '123456789',
    address: 'Toshkent',
    cadastre: '00:00:00',
    active: true,
    _soato_region: 'SOATO_REG',
    _soato: 'SOATO_CODE',
    region: 'Toshkent',
    _ownership: 'OWN_STATE',
    _university_type: 'TYPE_UNI',
    university_url: 'https://tatu.uz',
    teacher_url: 'https://teacher.tatu.uz',
    student_url: 'https://student.tatu.uz',
    uzbmb_url: 'https://uzbmb.tatu.uz',
    gpa_edit: true,
    accreditation_edit: false,
    add_student: true,
    allow_grouping: false,
    allow_transfer_outside: true,
    _version_type: 'V1',
    _terrain: 'PLAIN',
    mail_address: 'mail@tatu.uz',
    bank_info: 'Bank Info',
    accreditation_info: 'Accredited',
    _university_contract_category: 'CAT_A',
    _university_activity_status: 'ACTIVE',
    _university_belongs_to: 'MINISTRY',
    _parent_university: 'PARENT_UNI',
    ...overrides,
  }
}

/** Minimal camelCase DTO as the modern Spring Boot endpoint would return */
function camelCaseDTO(overrides = {}) {
  return {
    code: 'TDTU',
    name: 'TDTU University',
    tin: '987654321',
    address: 'Samarqand',
    cadastre: '11:11:11',
    active: false,
    soatoRegion: 'SOATO_REG_CC',
    soato: 'SOATO_CC',
    region: 'Samarqand',
    ownership: 'OWN_PRIVATE',
    universityType: 'TYPE_INST',
    universityUrl: 'https://tdtu.uz',
    teacherUrl: 'https://teacher.tdtu.uz',
    studentUrl: 'https://student.tdtu.uz',
    uzbmbUrl: 'https://uzbmb.tdtu.uz',
    gpaEdit: false,
    accreditationEdit: true,
    addStudent: false,
    allowGrouping: true,
    allowTransferOutside: false,
    versionType: 'V2',
    terrain: 'MOUNTAIN',
    mailAddress: 'mail@tdtu.uz',
    bankInfo: 'TDTU Bank',
    accreditationInfo: 'Not Accredited',
    contractCategory: 'CAT_B',
    activityStatus: 'INACTIVE',
    belongsTo: 'REGION',
    parentUniversity: 'PARENT_TDTU',
    ...overrides,
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('universitiesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── getUniversities ───────────────────────────────────────────────

  describe('getUniversities', () => {
    it('calls the correct endpoint with params and returns adapted content', async () => {
      const backendPage = {
        content: [snakeCaseDTO()],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: backendPage },
      })

      const params = { page: 0, size: 20, q: 'TATU' }
      const result = await universitiesApi.getUniversities(params)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/web/registry/universities', { params })
      expect(result.totalElements).toBe(1)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].code).toBe('TATU')
      // Verify that snake_case fields have been adapted
      expect(result.content[0].universityUrl).toBe('https://tatu.uz')
      expect(result.content[0].gpaEdit).toBe(true)
      expect(result.content[0].soatoRegion).toBe('SOATO_REG')
    })

    it('calls with default params when none provided', async () => {
      const backendPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: backendPage },
      })

      await universitiesApi.getUniversities()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/web/registry/universities', {
        params: {},
      })
    })

    it('handles null content gracefully', async () => {
      const backendPage = {
        content: null,
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: backendPage },
      })

      const result = await universitiesApi.getUniversities()
      expect(result.content).toEqual([])
    })
  })

  // ─── getUniversity ─────────────────────────────────────────────────

  describe('getUniversity', () => {
    it('calls the correct endpoint with id and returns adapted detail with parentUniversity', async () => {
      const dto = snakeCaseDTO()

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: dto },
      })

      const result = await universitiesApi.getUniversity('TATU')

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/web/registry/universities/TATU')
      expect(result.code).toBe('TATU')
      expect(result.parentUniversity).toBe('PARENT_UNI')
      expect(result.universityUrl).toBe('https://tatu.uz')
    })

    it('uses camelCase parentUniversity when snake_case is missing', async () => {
      const dto = camelCaseDTO()

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: dto },
      })

      const result = await universitiesApi.getUniversity('TDTU')

      expect(result.parentUniversity).toBe('PARENT_TDTU')
    })
  })

  // ─── adaptDTO behaviour (tested indirectly through getUniversities) ─

  describe('adaptDTO (via getUniversities)', () => {
    async function adaptSingle(dto: Record<string, unknown>) {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          data: {
            content: [dto],
            totalElements: 1,
            totalPages: 1,
            size: 20,
            number: 0,
          },
        },
      })
      const result = await universitiesApi.getUniversities()
      return result.content[0]
    }

    it('maps snake_case fields correctly', async () => {
      const row = await adaptSingle(snakeCaseDTO())

      expect(row.soatoRegion).toBe('SOATO_REG')
      expect(row.regionCode).toBe('SOATO_CODE')
      expect(row.ownershipCode).toBe('OWN_STATE')
      expect(row.universityTypeCode).toBe('TYPE_UNI')
      expect(row.universityUrl).toBe('https://tatu.uz')
      expect(row.teacherUrl).toBe('https://teacher.tatu.uz')
      expect(row.studentUrl).toBe('https://student.tatu.uz')
      expect(row.uzbmbUrl).toBe('https://uzbmb.tatu.uz')
      expect(row.gpaEdit).toBe(true)
      expect(row.accreditationEdit).toBe(false)
      expect(row.addStudent).toBe(true)
      expect(row.allowGrouping).toBe(false)
      expect(row.allowTransferOutside).toBe(true)
      expect(row.versionType).toBe('V1')
      expect(row.terrain).toBe('PLAIN')
      expect(row.mailAddress).toBe('mail@tatu.uz')
      expect(row.bankInfo).toBe('Bank Info')
      expect(row.accreditationInfo).toBe('Accredited')
      expect(row.contractCategory).toBe('CAT_A')
      expect(row.activityStatus).toBe('ACTIVE')
      expect(row.belongsTo).toBe('MINISTRY')
    })

    it('maps camelCase fields correctly', async () => {
      const row = await adaptSingle(camelCaseDTO())

      expect(row.soatoRegion).toBe('SOATO_REG_CC')
      expect(row.regionCode).toBe('SOATO_CC')
      expect(row.ownershipCode).toBe('OWN_PRIVATE')
      expect(row.universityTypeCode).toBe('TYPE_INST')
      expect(row.universityUrl).toBe('https://tdtu.uz')
      expect(row.teacherUrl).toBe('https://teacher.tdtu.uz')
      expect(row.studentUrl).toBe('https://student.tdtu.uz')
      expect(row.uzbmbUrl).toBe('https://uzbmb.tdtu.uz')
      expect(row.gpaEdit).toBe(false)
      expect(row.accreditationEdit).toBe(true)
      expect(row.addStudent).toBe(false)
      expect(row.allowGrouping).toBe(true)
      expect(row.allowTransferOutside).toBe(false)
      expect(row.versionType).toBe('V2')
      expect(row.terrain).toBe('MOUNTAIN')
      expect(row.mailAddress).toBe('mail@tdtu.uz')
      expect(row.bankInfo).toBe('TDTU Bank')
      expect(row.accreditationInfo).toBe('Not Accredited')
      expect(row.contractCategory).toBe('CAT_B')
      expect(row.activityStatus).toBe('INACTIVE')
      expect(row.belongsTo).toBe('REGION')
    })

    it('prefers snake_case over camelCase via nullish coalescing', async () => {
      // When both snake_case and camelCase are present, snake_case should win
      const dto = {
        code: 'MIXED',
        name: 'Mixed University',
        _soato_region: 'SNAKE_REGION',
        soatoRegion: 'CAMEL_REGION',
        _ownership: 'SNAKE_OWN',
        ownership: 'CAMEL_OWN',
        _university_type: 'SNAKE_TYPE',
        universityType: 'CAMEL_TYPE',
        university_url: 'https://snake.uz',
        universityUrl: 'https://camel.uz',
        teacher_url: 'https://snake-teacher.uz',
        teacherUrl: 'https://camel-teacher.uz',
        student_url: 'https://snake-student.uz',
        studentUrl: 'https://camel-student.uz',
        uzbmb_url: 'https://snake-uzbmb.uz',
        uzbmbUrl: 'https://camel-uzbmb.uz',
        gpa_edit: true,
        gpaEdit: false,
        accreditation_edit: true,
        accreditationEdit: false,
        add_student: true,
        addStudent: false,
        allow_grouping: true,
        allowGrouping: false,
        allow_transfer_outside: true,
        allowTransferOutside: false,
        _version_type: 'SNAKE_VER',
        versionType: 'CAMEL_VER',
        _terrain: 'SNAKE_TERRAIN',
        terrain: 'CAMEL_TERRAIN',
        mail_address: 'snake@mail.uz',
        mailAddress: 'camel@mail.uz',
        bank_info: 'Snake Bank',
        bankInfo: 'Camel Bank',
        accreditation_info: 'Snake Accred',
        accreditationInfo: 'Camel Accred',
        _university_contract_category: 'SNAKE_CAT',
        contractCategory: 'CAMEL_CAT',
        _university_activity_status: 'SNAKE_STATUS',
        activityStatus: 'CAMEL_STATUS',
        _university_belongs_to: 'SNAKE_BELONGS',
        belongsTo: 'CAMEL_BELONGS',
      }

      const row = await adaptSingle(dto)

      // snake_case variants are listed first in ?? chains, so they should win
      expect(row.soatoRegion).toBe('SNAKE_REGION')
      expect(row.regionCode).toBe('SNAKE_REGION')
      expect(row.ownershipCode).toBe('SNAKE_OWN')
      expect(row.universityTypeCode).toBe('SNAKE_TYPE')
      expect(row.universityUrl).toBe('https://snake.uz')
      expect(row.teacherUrl).toBe('https://snake-teacher.uz')
      expect(row.studentUrl).toBe('https://snake-student.uz')
      expect(row.uzbmbUrl).toBe('https://snake-uzbmb.uz')
      expect(row.gpaEdit).toBe(true)
      expect(row.accreditationEdit).toBe(true)
      expect(row.addStudent).toBe(true)
      expect(row.allowGrouping).toBe(true)
      expect(row.allowTransferOutside).toBe(true)
      expect(row.versionType).toBe('SNAKE_VER')
      expect(row.terrain).toBe('SNAKE_TERRAIN')
      expect(row.mailAddress).toBe('snake@mail.uz')
      expect(row.bankInfo).toBe('Snake Bank')
      expect(row.accreditationInfo).toBe('Snake Accred')
      expect(row.contractCategory).toBe('SNAKE_CAT')
      expect(row.activityStatus).toBe('SNAKE_STATUS')
      expect(row.belongsTo).toBe('SNAKE_BELONGS')
    })

    it('falls back to camelCase when snake_case fields are undefined', async () => {
      // Only camelCase fields present (no snake_case)
      const dto = {
        code: 'ONLY_CAMEL',
        name: 'Camel Only',
        soatoRegion: 'CAMEL_ONLY_REGION',
        ownership: 'CAMEL_ONLY_OWN',
        universityType: 'CAMEL_ONLY_TYPE',
        universityUrl: 'https://camel-only.uz',
        gpaEdit: true,
        versionType: 'CAMEL_VER',
        terrain: 'CAMEL_TERRAIN',
        mailAddress: 'camel-only@mail.uz',
        bankInfo: 'Camel Bank Only',
        accreditationInfo: 'Camel Accred Only',
        contractCategory: 'CAMEL_CAT_ONLY',
        activityStatus: 'CAMEL_STATUS_ONLY',
        belongsTo: 'CAMEL_BELONGS_ONLY',
      }

      const row = await adaptSingle(dto)

      expect(row.soatoRegion).toBe('CAMEL_ONLY_REGION')
      expect(row.ownershipCode).toBe('CAMEL_ONLY_OWN')
      expect(row.universityTypeCode).toBe('CAMEL_ONLY_TYPE')
      expect(row.universityUrl).toBe('https://camel-only.uz')
      expect(row.gpaEdit).toBe(true)
      expect(row.versionType).toBe('CAMEL_VER')
      expect(row.terrain).toBe('CAMEL_TERRAIN')
      expect(row.mailAddress).toBe('camel-only@mail.uz')
      expect(row.bankInfo).toBe('Camel Bank Only')
      expect(row.accreditationInfo).toBe('Camel Accred Only')
      expect(row.contractCategory).toBe('CAMEL_CAT_ONLY')
      expect(row.activityStatus).toBe('CAMEL_STATUS_ONLY')
      expect(row.belongsTo).toBe('CAMEL_BELONGS_ONLY')
    })

    it('handles regionCode fallback chain (_soato_region -> soatoRegion -> _soato -> soato)', async () => {
      // Only _soato present
      const dto1 = { code: 'R1', name: 'R1', _soato: 'SOATO_ONLY' }
      const row1 = await adaptSingle(dto1)
      expect(row1.regionCode).toBe('SOATO_ONLY')

      // Only soato present
      vi.clearAllMocks()
      const dto2 = { code: 'R2', name: 'R2', soato: 'SOATO_PLAIN' }
      const row2 = await adaptSingle(dto2)
      expect(row2.regionCode).toBe('SOATO_PLAIN')
    })
  })

  // ─── createUniversity ──────────────────────────────────────────────

  describe('createUniversity', () => {
    it('sends correct payload and returns adapted result', async () => {
      const inputData = {
        code: 'NEW_UNI',
        name: 'New University',
        tin: '111222333',
        ownershipCode: 'OWN_STATE',
        regionCode: 'REG_01',
        soatoRegion: 'SOATO_01',
        universityTypeCode: 'TYPE_UNI',
        address: 'Some Address',
        cadastre: '22:22:22',
        universityUrl: 'https://new.uz',
        studentUrl: 'https://student.new.uz',
        teacherUrl: 'https://teacher.new.uz',
        uzbmbUrl: 'https://uzbmb.new.uz',
        active: true,
        gpaEdit: true,
        accreditationEdit: false,
        addStudent: true,
        allowGrouping: false,
        allowTransferOutside: true,
      }

      const responseDTO = snakeCaseDTO({ code: 'NEW_UNI', name: 'New University' })

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, data: responseDTO },
      })

      const result = await universitiesApi.createUniversity(inputData)

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/web/registry/universities', {
        code: 'NEW_UNI',
        name: 'New University',
        tin: '111222333',
        ownership: 'OWN_STATE',
        soato: 'REG_01',
        soatoRegion: 'SOATO_01',
        universityType: 'TYPE_UNI',
        address: 'Some Address',
        cadastre: '22:22:22',
        universityUrl: 'https://new.uz',
        studentUrl: 'https://student.new.uz',
        teacherUrl: 'https://teacher.new.uz',
        uzbmbUrl: 'https://uzbmb.new.uz',
        active: true,
        gpaEdit: true,
        accreditationEdit: false,
        addStudent: true,
        allowGrouping: false,
        allowTransferOutside: true,
      })
      expect(result.code).toBe('NEW_UNI')
    })

    it('uses default values for optional boolean fields', async () => {
      const inputData = {
        code: 'DEFAULTS',
        name: 'Defaults University',
      }

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, data: { code: 'DEFAULTS', name: 'Defaults University' } },
      })

      await universitiesApi.createUniversity(inputData)

      const callPayload = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
      expect(callPayload.active).toBe(true)
      expect(callPayload.gpaEdit).toBe(false)
      expect(callPayload.accreditationEdit).toBe(true)
      expect(callPayload.addStudent).toBe(false)
      expect(callPayload.allowGrouping).toBe(false)
      expect(callPayload.allowTransferOutside).toBe(true)
    })
  })

  // ─── updateUniversity ──────────────────────────────────────────────

  describe('updateUniversity', () => {
    it('sends correct payload with code in URL and returns adapted result', async () => {
      const updateData = {
        code: 'TATU',
        name: 'Updated TATU',
        tin: '999999999',
        ownershipCode: 'OWN_PRIVATE',
        regionCode: 'REG_02',
        soatoRegion: 'SOATO_02',
        universityTypeCode: 'TYPE_INST',
        address: 'New Address',
        cadastre: '33:33:33',
        universityUrl: 'https://updated.uz',
        studentUrl: 'https://student.updated.uz',
        teacherUrl: 'https://teacher.updated.uz',
        uzbmbUrl: 'https://uzbmb.updated.uz',
        active: false,
        gpaEdit: false,
        accreditationEdit: true,
        addStudent: false,
        allowGrouping: true,
        allowTransferOutside: false,
      }

      const responseDTO = snakeCaseDTO({ code: 'TATU', name: 'Updated TATU' })

      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: true, data: responseDTO },
      })

      const result = await universitiesApi.updateUniversity('TATU', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/web/registry/universities/TATU', {
        code: 'TATU',
        name: 'Updated TATU',
        tin: '999999999',
        ownership: 'OWN_PRIVATE',
        soato: 'REG_02',
        soatoRegion: 'SOATO_02',
        universityType: 'TYPE_INST',
        address: 'New Address',
        cadastre: '33:33:33',
        universityUrl: 'https://updated.uz',
        studentUrl: 'https://student.updated.uz',
        teacherUrl: 'https://teacher.updated.uz',
        uzbmbUrl: 'https://uzbmb.updated.uz',
        active: false,
        gpaEdit: false,
        accreditationEdit: true,
        addStudent: false,
        allowGrouping: true,
        allowTransferOutside: false,
      })
      expect(result.code).toBe('TATU')
    })
  })

  // ─── deleteUniversity ──────────────────────────────────────────────

  describe('deleteUniversity', () => {
    it('calls DELETE endpoint with correct code', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })

      await universitiesApi.deleteUniversity('TATU')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/web/registry/universities/TATU')
    })
  })

  // ─── getDictionaries ───────────────────────────────────────────────

  describe('getDictionaries', () => {
    it('calls correct endpoint and returns dictionaries', async () => {
      const dictionaries = {
        ownerships: [{ code: 'STATE', name: 'Davlat' }],
        types: [{ code: 'UNI', name: 'Universitet' }],
        regions: [{ code: 'TOSH', name: 'Toshkent' }],
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: dictionaries },
      })

      const result = await universitiesApi.getDictionaries()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/web/registry/universities/dictionaries')
      expect(result).toEqual(dictionaries)
      expect(result.ownerships).toHaveLength(1)
      expect(result.types).toHaveLength(1)
      expect(result.regions).toHaveLength(1)
    })
  })

  // ─── exportUniversities ────────────────────────────────────────────

  describe('exportUniversities', () => {
    it('fetches all universities via GET and returns adapted rows', async () => {
      const backendPage = {
        content: [snakeCaseDTO(), camelCaseDTO()],
        totalElements: 2,
        totalPages: 1,
        size: 10000,
        number: 0,
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: backendPage },
      })

      const params = { q: 'TATU', regionId: 'REG_01' }
      const result = await universitiesApi.exportUniversities(params)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/web/registry/universities', {
        params: { ...params, page: 0, size: 10000 },
      })
      expect(result).toHaveLength(2)
      expect(result[0].code).toBe('TATU')
      expect(result[1].code).toBe('TDTU')
    })

    it('returns empty array when no content', async () => {
      const backendPage = {
        content: null,
        totalElements: 0,
        totalPages: 0,
        size: 10000,
        number: 0,
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: backendPage },
      })

      const result = await universitiesApi.exportUniversities({})
      expect(result).toEqual([])
    })
  })
})
