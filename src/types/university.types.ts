/**
 * University Info Module Types — Full API data
 */

/** Person reference — employee dan olinadi (dublikat yo'q) */
export interface PersonRef {
  pinfl: string | null
  firstName: string | null
  lastName: string | null
  middleName: string | null
  fullName: string | null
  phone: string | null
  email: string | null
  tin: string | null
  passportSeries: string | null
  passportNumber: string | null
  passport: string | null
  address: string | null
}

/** Organization reference — organization jadvalidan */
export interface OrganizationRef {
  tin: string | null
  name: string | null
}

export interface UniversityFounder {
  founderType: 'individual' | 'legal'
  name: string | null
  tin: string | null
  pinfl: string | null
  sharePercent: number | null
  shareSum: number | null
  isCurrent: boolean
  effectiveFrom: string | null
  effectiveTo: string | null
  // Nested refs
  person: PersonRef | null
  organization: OrganizationRef | null
}

export interface UniversityLifecycle {
  id: string
  universityCode: string
  eventType: string
  eventDate: string
  successorCode: string | null
  decreeNumber: string | null
  decreeDate: string | null
  studentsCount: number | null
  employeesCount: number | null
  oldName: string | null
  newName: string | null
  note: string | null
  createdAt: string
  createdBy: string | null
}

export interface UniversityCadastre {
  id: string
  universityCode: string
  cadNumber: string
  cadNumberOld: string | null
  regionId: number | null
  region: string | null
  districtId: number | null
  district: string | null
  address: string | null
  shortAddress: string | null
  street: string | null
  streetCode: string | null
  domNum: string | null
  neighborhood: string | null
  neighborhoodId: string | null
  tip: string | null
  tipText: string | null
  vid: string | null
  vidText: string | null
  landArea: number
  landAreaI: number | null
  landAreaB: number | null
  landAreaF: number | null
  landAreaZ: number | null
  landAreaD: number | null
  landAreaU: number | null
  objectArea: number
  objectAreaL: number | null
  objectAreaU: number | null
  cost: number | null
  ecoZone: string | null
  banIs: boolean
  landFundType: string | null
  landUseType: string | null
  landFundCategory: string | null
  subjects: string | null
  documents: string | null
  documentsL: string | null
  bans: string | null
  dataSource: string | null
  syncedAt: string | null
}

export interface UniversityRector {
  firstname: string | null
  lastname: string | null
  fathername: string | null
  pinfl: string | null
  phone: string | null
  positionCode: string | null
  positionName: string | null
}

export interface UniversityOfficial {
  employeeId: string
  metaId: string
  pinfl: string
  firstName: string
  lastName: string
  middleName: string | null
  phone: string | null
  positionCode: string
  positionName: string | null
  decreeNumber: string | null
  decreeDate: string | null
  startDate: string | null
  endDate: string | null
  current: boolean
}

export interface UniversitySocialLinks {
  website?: string | null
  telegram?: string | null
  instagram?: string | null
  youtube?: string | null
  facebook?: string | null
  twitter?: string | null
  linkedin?: string | null
}

export interface UniversityDocument {
  type: string
  name: string
  fileKey?: string | null
  mimeType?: string | null
  size?: number | null
  validFrom?: string | null
  validTo?: string | null
  uploadedAt?: string | null
}

export interface UniversityProfile {
  universityCode: string
  phone: string | null
  email: string | null
  description: string | null
  logoKey: string | null
  socialLinks: UniversitySocialLinks | null
  documents: UniversityDocument[]
  mapUrl: string | null
  latitude: number | null
  longitude: number | null
}

export type UniversityProfileRequest = Omit<UniversityProfile, 'universityCode'>

export interface UniversityDashboard {
  founders: UniversityFounder[]
  lifecycle: UniversityLifecycle[]
  cadastre: UniversityCadastre[]
  rector: UniversityRector | null
}
