export interface OAuthClientAdmin {
  id: string
  clientId: string
  clientName: string
  clientType: string
  universityCode: string | null
  universityName: string | null
  active: boolean
  grantTypes: string[] | null
  scopes: string[] | null
  roles: string[] | null
  secretVersion: number | null
  secretRotatedAt: string | null
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface OAuthClientCreateRequest {
  clientId: string
  clientSecret: string
  universityCode: string
  clientName?: string
  active?: boolean
}

export interface OAuthClientsParams {
  page?: number
  size?: number
  sort?: string
  search?: string
  clientType?: string
  university?: string
  active?: string
}
