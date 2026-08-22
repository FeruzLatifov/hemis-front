/**
 * OTM API-client siri uchun mustahkamlik bahosi.
 *
 * Bu **mashina kredensiali**, odam paroli emas — u bir marta OTM `.env` fayliga yoziladi va
 * hech kim uni eslab qolmaydi. Shuning uchun baho tarkib qoidalariga ("bitta bosh harf, bitta
 * raqam") emas, **entropiyaga** tayanadi. Bu NIST SP 800-63B yo'nalishi: tarkib qoidalari
 * odamlarni `Parol123!` kabi taxmin qilinadigan namunalarga majburlaydi, uzunlik esa haqiqiy
 * himoya beradi.
 *
 * Taqqoslash uchun: markaz avtomatik generatsiya qiladigan sir ~288 bit entropiyaga ega.
 * Qo'lda terilgan har qanday qiymat undan sezilarli zaif bo'ladi — shuning uchun avtomatik
 * rejim sukut bo'yicha tanlangan.
 */

/** Qo'lda kiritilgan sir uchun eng kam uzunlik — backend ham shu chegarani majburlaydi. */
export const SECRET_MIN_LENGTH = 12

export type SecretStrength = 'weak' | 'fair' | 'strong'

/** Barqaror kodlar — i18n kaliti sifatida ishlatiladi, matn emas. */
export type SecretIssue =
  | 'tooShort'
  | 'containsClientId'
  | 'commonWord'
  | 'lowEntropy'
  | 'repeated'
  | 'sequential'
  | 'singleClass'

/**
 * Yuborishni BLOKLAYDIGAN muammolar.
 *
 * ⚠️ Bu ro'yxat backend'dagi `SecretStrengthPolicy.java` bilan AYNAN bir xil bo'lishi shart.
 * Aks holda admin frontend'dan o'tib, serverdan 400 oladi — tushunarsiz va asabiy oqim.
 * `singleClass` ataylab ogohlantirish: uzun kichik-harfli satr mutlaqo yaroqli.
 */
const BLOCKING: ReadonlySet<SecretIssue> = new Set<SecretIssue>([
  'tooShort',
  'containsClientId',
  'commonWord',
  'lowEntropy',
  'repeated',
  'sequential',
])

/** Entropiyaning eng kam maqbul darajasi (bit). Backend ham shu chegarani ishlatadi. */
export const SECRET_MIN_ENTROPY_BITS = 50

/**
 * Taxmin qilinadigan negizlar — `admin123`, `Parol2026!`, `hemis_secret` kabilar.
 *
 * Bu "buzilgan parollar bazasi" emas, faqat eng ko'p uchraydigan negizlar. Haqiqiy himoya —
 * avtomatik generatsiya; bu ro'yxat shunchaki eng qo'pol tanlovlarni to'sadi.
 * ⚠️ Backend `SecretStrengthPolicy.COMMON_WORDS` bilan bir xil tutilsin.
 */
const COMMON_WORDS: readonly string[] = [
  'password',
  'passwd',
  'parol',
  'admin',
  'administrator',
  'root',
  'user',
  'login',
  'secret',
  'client',
  'qwerty',
  'asdf',
  'welcome',
  'letmein',
  'changeme',
  'default',
  'test',
  'demo',
  'sample',
  'example',
  'master',
  'system',
  'server',
  'hemis',
  'otm',
  'univer',
  'ministry',
  'vazirlik',
  'uzbek',
]

export interface SecretAssessment {
  strength: SecretStrength
  /** 0–100, faqat ko'rsatkich chizig'i uchun. */
  score: number
  entropyBits: number
  issues: SecretIssue[]
  /** Bloklaydigan muammo bormi (forma yuborilmaydi). */
  blocked: boolean
}

/** 4+ uzunlikdagi ketma-ket yurish: `abcd`, `4321`, `wxyz`. */
function hasSequentialRun(value: string): boolean {
  const lower = value.toLowerCase()
  let run = 1
  let direction = 0
  for (let i = 1; i < lower.length; i++) {
    const delta = lower.charCodeAt(i) - lower.charCodeAt(i - 1)
    if (delta === 1 || delta === -1) {
      if (delta === direction) {
        run++
      } else {
        direction = delta
        run = 2
      }
      if (run >= 4) return true
    } else {
      direction = 0
      run = 1
    }
  }
  return false
}

/**
 * Sirni baholaydi.
 *
 * @param value  baholanayotgan ochiq sir
 * @param clientId  shu hisobning client_id'si — sir uning ichida bo'lsa bu jiddiy nuqson
 *                  (kim client_id'ni bilsa, sirni ham taxmin qiladi)
 */
export function assessSecret(value: string, clientId?: string): SecretAssessment {
  const issues: SecretIssue[] = []

  if (!value) {
    return { strength: 'weak', score: 0, entropyBits: 0, issues: ['tooShort'], blocked: true }
  }

  if (value.length < SECRET_MIN_LENGTH) issues.push('tooShort')

  const id = clientId?.trim().toLowerCase()
  if (id && id.length >= 3 && value.toLowerCase().includes(id)) issues.push('containsClientId')

  const hasLower = /[a-z]/.test(value)
  const hasUpper = /[A-Z]/.test(value)
  const hasDigit = /[0-9]/.test(value)
  const hasSymbol = /[^a-zA-Z0-9]/.test(value)

  const poolSize =
    (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasDigit ? 10 : 0) + (hasSymbol ? 33 : 0)

  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length
  if (classes === 1 && value.length < 20) issues.push('singleClass')

  // Takrorlanish jarimasi: "aaaaaaaaaaaa" xom hisobda 12 belgi bo'lsa-da, amalda bitta belgi.
  const uniqueRatio = new Set(value).size / value.length
  if (uniqueRatio < 0.35) issues.push('repeated')

  if (hasSequentialRun(value)) issues.push('sequential')

  // Taxmin qilinadigan negiz: `admin123` — 12 belgiga cho'zilsa ham lug'at so'zi bo'lib qolaveradi,
  // shuning uchun entropiya hisobi buni o'zi tutmaydi.
  const lowered = value.toLowerCase()
  if (COMMON_WORDS.some((w) => lowered.includes(w))) issues.push('commonWord')

  const rawEntropy = poolSize > 0 ? value.length * Math.log2(poolSize) : 0
  const entropyBits = Math.round(rawEntropy * (0.4 + 0.6 * uniqueRatio))

  if (entropyBits < SECRET_MIN_ENTROPY_BITS) issues.push('lowEntropy')

  const blocked = issues.some((i) => BLOCKING.has(i))

  let strength: SecretStrength
  if (blocked || entropyBits < SECRET_MIN_ENTROPY_BITS) {
    strength = 'weak'
  } else if (entropyBits < 75) {
    strength = 'fair'
  } else {
    strength = 'strong'
  }

  // Ko'rsatkich: 100 bit ni "to'la" deb olamiz — bundan yuqorisi amalda farq qilmaydi.
  const score = Math.max(0, Math.min(100, Math.round((entropyBits / 100) * 100)))

  return { strength, score, entropyBits, issues, blocked }
}
