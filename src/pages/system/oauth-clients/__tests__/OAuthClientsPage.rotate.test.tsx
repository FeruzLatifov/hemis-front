import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import type { OAuthClientSecretResponse } from '@/types/oauthClient.types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: true,
      user: { name: 'Admin', locale: 'uz' },
      permissions: ['oauth-clients.view', 'oauth-clients.manage'],
    }
    return selector ? selector(state) : state
  }),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

const copySpy = vi.fn<(text: string) => Promise<boolean>>(async () => true)
vi.mock('@/lib/clipboard', () => ({
  copyToClipboard: (text: string) => copySpy(text),
}))

const CLIENT = {
  id: 'c-1',
  clientId: 'otm301',
  clientName: 'Andijon davlat universiteti',
  clientType: 'UNIVERSITY_BACKEND',
  universityCode: '301',
  universityName: 'Andijon davlat universiteti',
  active: true,
  grantTypes: null,
  scopes: null,
  roles: null,
  secretVersion: 1,
  secretRotatedAt: null,
  lastUsedAt: null,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: null,
}

/** Har testda alohida sozlanadi: mutation nima qaytarishini test boshqaradi. */
const rotateMutate = vi.fn()

vi.mock('@/hooks/useOAuthClients', () => ({
  useOAuthClients: () => ({
    data: { content: [CLIENT], totalElements: 1, totalPages: 1, number: 0, size: 20 },
    isLoading: false,
  }),
  useCreateOAuthClient: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleOAuthClientStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteOAuthClient: () => ({ mutate: vi.fn(), isPending: false }),
  useRotateOAuthClientSecret: () => ({ mutate: rotateMutate, isPending: false }),
}))

vi.mock('@/hooks/useUniversities', () => ({
  useUniversities: () => ({ data: { content: [] }, isLoading: false }),
}))

import OAuthClientsPage from '../OAuthClientsPage'

/** mutate(vars, { onSuccess }) ni server javobi bilan taqlid qiladi. */
const respondWith = (response: Partial<OAuthClientSecretResponse>) => {
  rotateMutate.mockImplementation(
    (_vars: unknown, opts?: { onSuccess?: (r: OAuthClientSecretResponse) => void }) =>
      opts?.onSuccess?.({
        id: 'c-1',
        clientId: 'otm301',
        plainSecret: null,
        secretVersion: 2,
        rotatedAt: '2026-08-21T12:00:00',
        warning: 'ogohlantirish matni',
        ...response,
      } as OAuthClientSecretResponse),
  )
}

const openRotateDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTitle('Rotate secret'))
  await screen.findByText('Generate automatically')
}

/** Maydonlar label bilan bog'langan — indeks emas, nom bo'yicha topamiz. */
const secretInput = () => screen.getByLabelText('New secret')
const confirmInput = () => screen.getByLabelText('Repeat new secret')
const confirmButton = () => screen.getAllByText('Rotate secret')[1].closest('button')!

const enterManual = async (
  user: ReturnType<typeof userEvent.setup>,
  secret: string,
  confirm = secret,
) => {
  await user.click(screen.getByText('Enter manually'))
  await user.type(secretInput(), secret)
  await user.type(confirmInput(), confirm)
}

describe('OAuthClientsPage — sir rotatsiyasi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    respondWith({})
  })

  it('rotatsiya tugmasi dialogni ochadi', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)

    await openRotateDialog(user)

    expect(screen.getByText('Enter manually')).toBeInTheDocument()
    // Tokenlar haqidagi ogohlantirish KO'RINISHI shart — admin buni bilmasa
    // rotatsiyadan keyin kirish darhol to'xtadi deb o'ylaydi.
    expect(
      screen.getByText(
        'Already-issued tokens stay valid for up to 24 hours. Rotating or disabling only blocks new tokens.',
      ),
    ).toBeInTheDocument()
  })

  it('avtomatik rejim: clientSecret YUBORILMAYDI', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await user.click(screen.getAllByText('Rotate secret')[1])

    expect(rotateMutate).toHaveBeenCalledTimes(1)
    expect(rotateMutate.mock.calls[0][0]).toEqual({ id: 'c-1', clientSecret: undefined })
  })

  it('qo’lda rejim: 12 belgidan qisqa sir bilan tasdiqlab BO‘LMAYDI', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await enterManual(user, 'qisqa')

    expect(confirmButton()).toBeDisabled()
    expect(rotateMutate).not.toHaveBeenCalled()
  })

  it('takror kiritish MOS KELMASA tasdiqlab bo‘lmaydi', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await enterManual(user, '7Kq!zR4$mW9pXv2#', '7Kq!zR4$mW9pXv2#BOSHQA')

    expect(await screen.findByText('Secrets do not match')).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
    expect(rotateMutate).not.toHaveBeenCalled()
  })

  it('takror kiritish BO‘SH bo‘lsa ham tasdiqlab bo‘lmaydi', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await user.click(screen.getByText('Enter manually'))
    await user.type(secretInput(), '7Kq!zR4$mW9pXv2#')

    expect(confirmButton()).toBeDisabled()
  })

  it('sir client_id ni o‘z ichiga olsa tasdiqlab bo‘lmaydi', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await enterManual(user, 'xK9-otm301-mQ7wZpL')

    expect(await screen.findByText('Must not contain the Client ID')).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  it('admin123 kabi oson sir TASDIQLANMAYDI (foydalanuvchi ko‘rsatgan holat)', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await enterManual(user, 'admin1234567')

    expect(
      await screen.findByText('Avoid guessable words like admin, password or test'),
    ).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
    expect(rotateMutate).not.toHaveBeenCalled()
  })

  it('mustahkamlik ko‘rsatkichi kuchli sirni KUCHLI deb belgilaydi', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await user.click(screen.getByText('Enter manually'))
    await user.type(secretInput(), '7Kq!zR4$mW9pXv2#Lb6@')

    expect(await screen.findByText('Strong')).toBeInTheDocument()
  })

  it('qo’lda rejim: yaroqli sir yuboriladi (bo‘shliqlar olib tashlanadi)', async () => {
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await enterManual(user, '  7Kq!zR4$mW9pXv2#  ')
    await user.click(confirmButton())

    expect(rotateMutate.mock.calls[0][0]).toEqual({
      id: 'c-1',
      clientSecret: '7Kq!zR4$mW9pXv2#',
    })
  })

  it('markaz sir generatsiya qilsa — bir martalik dialogda KO‘RSATILADI', async () => {
    respondWith({ plainSecret: 'csec_TEST_SECRET_VALUE' })
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await user.click(screen.getAllByText('Rotate secret')[1])

    expect(await screen.findByText('New secret — copy now')).toBeInTheDocument()
    expect(screen.getByText('csec_TEST_SECRET_VALUE')).toBeInTheDocument()
    // Ochiq sir bor ekan, toast bilan almashtirilmasligi kerak.
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('admin o‘z sirini bersa — ochiq sir dialogi CHIQMAYDI, oddiy tasdiq bo‘ladi', async () => {
    respondWith({ plainSecret: null })
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)

    await enterManual(user, '7Kq!zR4$mW9pXv2#')
    await user.click(confirmButton())

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Secret changed'))
    expect(screen.queryByText('New secret — copy now')).not.toBeInTheDocument()
  })

  it('nusxalash @/lib/clipboard orqali ketadi (HTTP muhitda navigator.clipboard yo‘q)', async () => {
    respondWith({ plainSecret: 'csec_TEST_SECRET_VALUE' })
    const user = userEvent.setup()
    render(<OAuthClientsPage />)
    await openRotateDialog(user)
    await user.click(screen.getAllByText('Rotate secret')[1])
    await screen.findByText('New secret — copy now')

    await user.click(screen.getByText('Copy'))

    expect(copySpy).toHaveBeenCalledWith('csec_TEST_SECRET_VALUE')
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })
})
