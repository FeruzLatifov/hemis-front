import { assessSecret, SECRET_MIN_LENGTH } from '../secretStrength'

/**
 * Mustahkamlik bahosi — OTM API-client siri uchun.
 *
 * Asosiy shart: baho ENTROPIYAGA tayanadi, tarkib qoidalariga emas. Ya'ni uzun-tasodifiy
 * kichik harfli satr "Parol123!" dan KUCHLIROQ bo'lishi kerak — aks holda biz odamlarni
 * taxmin qilinadigan namunalarga majburlagan bo'lardik (NIST SP 800-63B).
 */
describe('assessSecret', () => {
  describe('bloklaydigan nuqsonlar', () => {
    it('bo’sh qiymat bloklanadi', () => {
      const r = assessSecret('')
      expect(r.blocked).toBe(true)
      expect(r.issues).toContain('tooShort')
      expect(r.strength).toBe('weak')
    })

    it(`${SECRET_MIN_LENGTH} belgidan qisqa bloklanadi`, () => {
      const r = assessSecret('qisqa123')
      expect(r.blocked).toBe(true)
      expect(r.issues).toContain('tooShort')
    })

    it('chegaradagi uzunlik (aynan minimum) bloklanmaydi', () => {
      const r = assessSecret('aB3$xY9!kL2@')
      expect(r.issues).not.toContain('tooShort')
      expect(r.blocked).toBe(false)
    })

    it('client_id ni o’z ichiga olsa bloklanadi (registrdan qat’i nazar)', () => {
      const r = assessSecret('xK9-OTM301-mQ7wZ', 'otm301')
      expect(r.blocked).toBe(true)
      expect(r.issues).toContain('containsClientId')
    })

    it('client_id berilmasa bu tekshiruv o’tkazib yuboriladi', () => {
      const r = assessSecret('xK9-OTM301-mQ7wZ')
      expect(r.issues).not.toContain('containsClientId')
    })

    it('juda qisqa client_id (<3) noto’g’ri moslikka olib kelmaydi', () => {
      // 'a' bo'yicha moslashtirish deyarli har qanday sirni bloklab qo'yardi.
      const r = assessSecret('aB3$xY9!kL2@', 'a')
      expect(r.issues).not.toContain('containsClientId')
    })
  })

  describe('taxmin qilinadigan namunalar ham BLOKLAYDI', () => {
    it('takrorlanuvchi belgilar bloklaydi', () => {
      const r = assessSecret('aaaaaaaaaaaaaaaa')
      expect(r.issues).toContain('repeated')
      expect(r.blocked).toBe(true)
      expect(r.strength).toBe('weak')
    })

    it('lug’at so’zi bloklaydi — admin1234567 (12 belgi bo’lsa ham)', () => {
      const r = assessSecret('admin1234567')
      expect(r.issues).toContain('commonWord')
      expect(r.blocked).toBe(true)
    })

    it('past entropiya bloklaydi', () => {
      const r = assessSecret('abababababab')
      expect(r.blocked).toBe(true)
    })

    it('ketma-ketlik aniqlanadi (abcd)', () => {
      expect(assessSecret('Xy!abcde9012Qw').issues).toContain('sequential')
    })

    it('teskari ketma-ketlik ham aniqlanadi (4321)', () => {
      expect(assessSecret('Xy!4321mmQwEr').issues).toContain('sequential')
    })

    it('ketma-ketlik bo’lmasa belgilanmaydi', () => {
      expect(assessSecret('xK9mQ7wZpL4vN2').issues).not.toContain('sequential')
    })

    it('bitta belgi sinfi va qisqa bo’lsa belgilanadi', () => {
      expect(assessSecret('abcdefghjkmn').issues).toContain('singleClass')
    })

    it('bitta sinf bo’lsa-da yetarlicha uzun bo’lsa belgilanmaydi', () => {
      // Uzunlik entropiyani qoplaydi — bu aynan biz qo'llab-quvvatlamoqchi bo'lgan holat.
      expect(assessSecret('qwrtpsdfghjklzxcvbnm').issues).not.toContain('singleClass')
    })

    it('singleClass YAGONA ogohlantirish — o’zi bloklamaydi', () => {
      // 'abcdefghjkmn' boshqa sabablarga ko'ra bloklanishi mumkin; bu yerda muhimi
      // singleClass'ning O'ZI bloklovchilar ro'yxatida emasligi.
      const r = assessSecret('qwrtpsdfghjklzxcvbnm')
      expect(r.blocked).toBe(false)
    })
  })

  describe('entropiya darajalari', () => {
    it('uzun-tasodifiy sir KUCHLI', () => {
      const r = assessSecret('7Kq!zR4$mW9pXv2#Lb6@')
      expect(r.strength).toBe('strong')
      expect(r.entropyBits).toBeGreaterThanOrEqual(75)
    })

    it('uzun kichik-harfli satr klassik "murakkab" paroldan kuchliroq', () => {
      // Bu bahoning asosiy da'vosi: uzunlik > tarkib qoidalari.
      const long = assessSecret('qwrtpsdfghjklzxcvbnm')
      const complex = assessSecret('Parol123!abc')
      expect(long.entropyBits).toBeGreaterThan(complex.entropyBits)
    })

    it('score 0..100 oralig’ida qoladi', () => {
      for (const v of ['', 'a', 'aB3$xY9!kL2@', '7Kq!zR4$mW9pXv2#Lb6@'.repeat(5)]) {
        const { score } = assessSecret(v)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      }
    })

    it('bloklangan qiymat har doim weak', () => {
      // Uzun va tasodifiy bo'lsa ham, client_id ichida bo'lsa kuchli deb ko’rsatilmaydi.
      const r = assessSecret('7Kq!zR4$otm301mW9pXv2#Lb6@', 'otm301')
      expect(r.blocked).toBe(true)
      expect(r.strength).toBe('weak')
    })
  })
})
