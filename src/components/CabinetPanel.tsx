import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl, fetchAuthForm, fetchAuthJson } from '@/lib/api'
import { decodeUzAddress, encodeUzAddress, type UzAddrPayload } from '@/lib/uzAddressCodec'
import { getUzAddressHierarchy, tumanIdToMfyFileSlug, type UzViloyat } from '@/lib/uzGeoHierarchy'
import { loadMahallaOptionsForTuman } from '@/lib/loadUzMahallaOptions'
import { AuthedAvatarCircleCover } from '@/components/AuthedAvatarCircleCover'
import { filePickTriggerLabelClass } from '@/lib/fileFieldStyles'

export type CabinetFileKind = 'passport-front' | 'passport-back' | 'summary-pdf' | 'avatar'

export type CabinetEndpoints = {
  load: string
  profilePatch: string
  avatar: string
  passportFront: string
  passportBack: string
  cabinetFile: (kind: CabinetFileKind) => string
  /** Bo‘lmasa talaba rejimida: maʼlumotnoma faqat ko‘rinadi / yuklab olinadi. */
  summaryPdfPost?: string
  summaryPdfDelete?: string
  /** Admin: toʻliq kabinet — bitta PDF (matn + rasmlar/skannlar birlashtirilgan). */
  dataExport?: string
}

type Profile = {
  login: string
  fullName: string
  groupName: string | null
  phone: string | null
  birthDate: string | null
  passportSeries: string | null
  passportNumber: string | null
  avatarPath: string | null
  passportPhotoFrontPath: string | null
  passportPhotoBackPath: string | null
  cabinetSummaryPdfPath: string | null
  address: string | null
  faculty: string | null
  studyDirection: string | null
}

type AchievementRow = {
  id: string
  category: string
  certificateLanguage: string | null
  title: string
  description: string | null
  achievedAt: string
  filePath: string | null
}

type CabinetPayload = { profile: Profile; achievements: AchievementRow[] }

const inputClass =
  'w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'

const BIRTH_MONTHS_UZ: { value: string; label: string }[] = [
  { value: '01', label: 'Yanvar' },
  { value: '02', label: 'Fevral' },
  { value: '03', label: 'Mart' },
  { value: '04', label: 'Aprel' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Iyun' },
  { value: '07', label: 'Iyul' },
  { value: '08', label: 'Avgust' },
  { value: '09', label: 'Sentabr' },
  { value: '10', label: 'Oktabr' },
  { value: '11', label: 'Noyabr' },
  { value: '12', label: 'Dekabr' },
]

/** API va profildan kelgan qiymatni yyyy-mm-dd qilib olamiz */
function isoDayOnlyFromProfile(raw: string | null | undefined): string {
  if (raw == null || raw === '') return ''
  const head = /^(\d{4}-\d{2}-\d{2})/.exec(String(raw).trim())
  return head ? head[1] : ''
}

function daysInMonth(year: number, month1To12: number): number {
  return new Date(year, month1To12, 0).getDate()
}

/** Tanlangan kun/oy/yil dan server formatiga — hammasi toʻldirilganda */
function birthPickToIso(parts: { y: string; m: string; d: string }): string {
  const y = parts.y.trim()
  const mo = parts.m.trim()
  const d = parts.d.trim()
  if (!y || !mo || !d) return ''
  const yi = Number(y)
  const mi = Number(mo)
  let di = Number(d)
  if (!Number.isFinite(yi) || !Number.isFinite(mi) || !Number.isFinite(di)) return ''
  if (yi < 1 || mi < 1 || mi > 12 || di < 1) return ''
  const maxD = daysInMonth(yi, mi)
  if (di > maxD) di = maxD
  return `${yi}-${String(mi).padStart(2, '0')}-${String(di).padStart(2, '0')}`
}

function isoToBirthPick(iso: string): { y: string; m: string; d: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return { y: '', m: '', d: '' }
  const yi = Number(m[1])
  const moi = Number(m[2])
  let di = Number(m[3])
  if (!yi || moi < 1 || moi > 12 || di < 1) return { y: '', m: '', d: '' }
  const maxD = daysInMonth(yi, moi)
  di = Math.min(di, maxD)
  return { y: String(yi), m: String(moi).padStart(2, '0'), d: String(di).padStart(2, '0') }
}

/** Oʻzbekiston FK: seriya — 2 ta lotin harfi, raqami — 7 ta raqam */
function sanitizePassportSeries(raw: string): string {
  return raw.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2)
}

function sanitizePassportNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 7)
}

function passportUzPairError(series: string, number: string): string {
  const sEmpty = series.length === 0
  const nEmpty = number.length === 0
  if (sEmpty && nEmpty) return ''
  if (series.length !== 2) return 'Pasport seriyasida faqat 2 ta lotin harf bo‘lishi kerak.'
  if (number.length !== 7) return 'Pasport raqami 7 ta raqamdan iborat bo‘lishi kerak.'
  return ''
}

const MFY_OTHER = '__mfy_other__'

type UzAddrForm = { viloyatId: string; tumanId: string; mfy: string; street: string }
const EMPTY_UZ_ADDR: UzAddrForm = { viloyatId: '', tumanId: '', mfy: '', street: '' }

function isDecodedAddressValid(payload: UzAddrPayload, hier: UzViloyat[]): boolean {
  const v = hier.find((x) => x.id === payload.vi)
  return Boolean(v?.tumans.some((t) => t.id === payload.ti))
}

export function CabinetPanel(props: {
  token: string | null
  urls: CabinetEndpoints
  adminContactEditable: boolean
  title: string
  subtitle?: string
  backNav?: { to: string; label: string }
}) {
  const { token, urls, adminContactEditable, title, subtitle, backNav } = props
  const [payload, setPayload] = useState<CabinetPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [savingProf, setSavingProf] = useState(false)

  const [draft, setDraft] = useState({
    fullName: '',
    birthDate: '',
    passportSeries: '',
    passportNumber: '',
    groupName: '',
    phone: '',
    faculty: '',
    studyDirection: '',
  })

  const uzHierarchy = useMemo(() => getUzAddressHierarchy(), [])
  const [addr, setAddr] = useState<UzAddrForm>(EMPTY_UZ_ADDR)
  const [legacyAddressText, setLegacyAddressText] = useState('')
  const [mahallaChoices, setMahallaChoices] = useState<string[]>([])
  const [mahallaLoading, setMahallaLoading] = useState(false)

  /** Yil, oy va kun uchun tanlash (brauzerdagi kalendardan mustaqil) */
  const [birthPick, setBirthPick] = useState({ y: '', m: '', d: '' })

  const [summaryPdfBusy, setSummaryPdfBusy] = useState(false)

  const birthYearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    const minY = Math.max(now - 90, 1940)
    const years: number[] = []
    for (let y = now; y >= minY; y--) years.push(y)
    return years
  }, [])

  /** Tanlov o‘zgarganda `draft.birthDate` bilan sinxron (server formatida) */
  function patchBirthPick(field: 'y' | 'm' | 'd', value: string) {
    setBirthPick((prev) => {
      let next = { ...prev, [field]: value }

      const yi = next.y === '' ? NaN : Number(next.y)
      const mi = next.m === '' ? NaN : Number(next.m)

      if (
        next.d !== '' &&
        Number.isFinite(yi) &&
        Number.isFinite(mi) &&
        mi >= 1 &&
        mi <= 12 &&
        field !== 'd'
      ) {
        const maxD = daysInMonth(yi, mi)
        let di = Number(next.d)
        if (Number.isFinite(di)) {
          if (di > maxD) di = maxD
          next = { ...next, d: String(di).padStart(2, '0') }
        }
      }

      const iso = birthPickToIso(next)
      setDraft((d0) => ({ ...d0, birthDate: iso }))
      return next
    })
  }

  const birthDayCap =
    birthPick.y && birthPick.m
      ? daysInMonth(Number(birthPick.y), Number(birthPick.m))
      : 31

  const tumaniForViloyat = useMemo(() => {
    return uzHierarchy.find((v) => v.id === addr.viloyatId)?.tumans ?? []
  }, [uzHierarchy, addr.viloyatId])

  useEffect(() => {
    const slug = addr.tumanId ? tumanIdToMfyFileSlug(addr.tumanId) : ''
    if (!slug) {
      setMahallaChoices([])
      setMahallaLoading(false)
      return
    }
    let cancelled = false
    setMahallaLoading(true)
    void loadMahallaOptionsForTuman(slug)
      .then((xs) => {
        if (!cancelled) setMahallaChoices(xs)
      })
      .finally(() => {
        if (!cancelled) setMahallaLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [addr.tumanId])

  let mfDropdownValue = ''
  if (mahallaChoices.length > 0) {
    if (mahallaChoices.includes(addr.mfy)) mfDropdownValue = addr.mfy
    else if (addr.mfy) mfDropdownValue = MFY_OTHER
    else mfDropdownValue = ''
  }
  const showMfyFreeText =
    mahallaChoices.length === 0 || mfDropdownValue === MFY_OTHER

  const refresh = useCallback(async () => {
    if (!token) return
    setErr('')
    const data = await fetchAuthJson<CabinetPayload>(urls.load, token)
    const bd = isoDayOnlyFromProfile(data.profile.birthDate)
    setPayload(data)
    setBirthPick(isoToBirthPick(bd))
    const hier = getUzAddressHierarchy()
    const rawAddr = data.profile.address ?? ''
    const dec = decodeUzAddress(rawAddr)
    if (dec && isDecodedAddressValid(dec, hier)) {
      setAddr({
        viloyatId: dec.vi,
        tumanId: dec.ti,
        mfy: dec.m,
        street: dec.k,
      })
      setLegacyAddressText('')
    } else if (rawAddr.trim()) {
      setAddr(EMPTY_UZ_ADDR)
      setLegacyAddressText(rawAddr)
    } else {
      setAddr(EMPTY_UZ_ADDR)
      setLegacyAddressText('')
    }
    setDraft({
      fullName: data.profile.fullName,
      birthDate: bd,
      passportSeries: sanitizePassportSeries(data.profile.passportSeries ?? ''),
      passportNumber: sanitizePassportNumber(data.profile.passportNumber ?? ''),
      groupName: data.profile.groupName ?? '',
      phone: data.profile.phone ?? '',
      faculty: data.profile.faculty ?? '',
      studyDirection: data.profile.studyDirection ?? '',
    })
    setLoading(false)
  }, [token, urls.load])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    void refresh().catch((e) => {
      setErr(e instanceof Error ? e.message : 'Yuklashda xato')
      setLoading(false)
    })
  }, [token, refresh])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setSavingProf(true)
    setErr('')
    try {
      const birthDateNormalized = birthPickToIso(birthPick)
      const passportSeriesClean = sanitizePassportSeries(draft.passportSeries)
      const passportNumberClean = sanitizePassportNumber(draft.passportNumber)
      const passErr = passportUzPairError(passportSeriesClean, passportNumberClean)
      if (passErr) {
        setErr(passErr)
        setSavingProf(false)
        return
      }

      const mf = addr.mfy.trim()
      const st = addr.street.trim()
      const hasPiece = !!(addr.viloyatId || addr.tumanId || mf || st)
      let encodedAddress = ''
      if (hasPiece) {
        if (!addr.viloyatId || !addr.tumanId || !mf || !st) {
          setErr(
            'Viloyat, tuman, MFY (mahalla) va koʻcha / uy manzilini toʻliq kiriting — yoki manzilni boʻsh qoldiring.',
          )
          setSavingProf(false)
          return
        }
        encodedAddress = encodeUzAddress({
          vi: addr.viloyatId,
          ti: addr.tumanId,
          m: mf,
          k: st,
        })
        if (encodedAddress.length > 500) {
          setErr('Manzil juda uzun (500 belgidan oshmasin). Koʻcha qismini qisqartiring.')
          setSavingProf(false)
          return
        }
      }

      const body: Record<string, string> = {
        fullName: draft.fullName.trim(),
        birthDate: birthDateNormalized,
        passportSeries: passportSeriesClean,
        passportNumber: passportNumberClean,
        phone: draft.phone.trim(),
        address: encodedAddress,
        faculty: draft.faculty.trim(),
        studyDirection: draft.studyDirection.trim(),
      }
      if (adminContactEditable) {
        body.groupName = draft.groupName.trim()
      }
      const data = await fetchAuthJson<CabinetPayload>(urls.profilePatch, token, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setPayload(data)
      const savedBd = isoDayOnlyFromProfile(data.profile.birthDate)
      setBirthPick(isoToBirthPick(savedBd))
      const hier2 = getUzAddressHierarchy()
      const rawAd = data.profile.address ?? ''
      const dec2 = decodeUzAddress(rawAd)
      if (dec2 && isDecodedAddressValid(dec2, hier2)) {
        setAddr({
          viloyatId: dec2.vi,
          tumanId: dec2.ti,
          mfy: dec2.m,
          street: dec2.k,
        })
        setLegacyAddressText('')
      } else if (rawAd.trim()) {
        setAddr(EMPTY_UZ_ADDR)
        setLegacyAddressText(rawAd)
      } else {
        setAddr(EMPTY_UZ_ADDR)
        setLegacyAddressText('')
      }
      setDraft({
        fullName: data.profile.fullName,
        birthDate: savedBd,
        passportSeries: sanitizePassportSeries(data.profile.passportSeries ?? ''),
        passportNumber: sanitizePassportNumber(data.profile.passportNumber ?? ''),
        groupName: data.profile.groupName ?? '',
        phone: data.profile.phone ?? '',
        faculty: data.profile.faculty ?? '',
        studyDirection: data.profile.studyDirection ?? '',
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSavingProf(false)
    }
  }

  async function uploadAvatar(file: File | null) {
    if (!token || !file) return
    setErr('')
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const data = await fetchAuthForm<CabinetPayload>(urls.avatar, token, fd)
      setPayload(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    }
  }

  async function uploadPassport(side: 'front' | 'back', file: File | null) {
    if (!token || !file) return
    setErr('')
    const fd = new FormData()
    fd.append('photo', file)
    const url = side === 'front' ? urls.passportFront : urls.passportBack
    try {
      const data = await fetchAuthForm<CabinetPayload>(url, token, fd)
      setPayload(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    }
  }

  async function uploadCabinetSummaryPdfFile(file: File | null) {
    if (!token || !file || !urls.summaryPdfPost) return
    setSummaryPdfBusy(true)
    setErr('')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const data = await fetchAuthForm<CabinetPayload>(urls.summaryPdfPost!, token, fd)
      setPayload(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSummaryPdfBusy(false)
    }
  }

  async function removeCabinetSummaryPdf() {
    if (!token || !urls.summaryPdfDelete || !confirm('Maʼlumotnoma PDF o‘chirilsinmi?')) return
    setSummaryPdfBusy(true)
    setErr('')
    try {
      const data = await fetchAuthJson<CabinetPayload>(urls.summaryPdfDelete!, token, { method: 'DELETE' })
      setPayload(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSummaryPdfBusy(false)
    }
  }

  async function authDownloadCabinet(kind: CabinetFileKind, fallbackName: string) {
    if (!token) return
    setErr('')
    try {
      const r = await fetch(apiUrl(urls.cabinetFile(kind)), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) {
        let msg = `HTTP ${r.status}`
        try {
          const j = (await r.clone().json()) as { error?: string }
          if (j?.error) msg = j.error
        } catch {
          /* noop */
        }
        throw new Error(msg)
      }
      const blob = await r.blob()
      const cd = r.headers.get('Content-Disposition')
      let fileName = fallbackName
      const m = /filename="([^";]+)"/.exec(cd ?? '')
      if (m?.[1]) fileName = m[1]
      const objectUrl = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = fileName
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Yuklab olish muvaffaqiyatsiz')
    }
  }

  async function downloadCabinetDataExport() {
    if (!token || !urls.dataExport || !payload) return
    setErr('')
    try {
      const r = await fetch(apiUrl(urls.dataExport), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) {
        let msg = `HTTP ${r.status}`
        try {
          const j = (await r.clone().json()) as { error?: string }
          if (j?.error) msg = j.error
        } catch {
          /* noop */
        }
        throw new Error(msg)
      }
      const blob = await r.blob()
      const cd = r.headers.get('Content-Disposition')
      let fileName = `kabinet_${payload.profile.login}_export.pdf`
      const m = /filename="([^";]+)"/.exec(cd ?? '')
      if (m?.[1]) fileName = m[1]
      const objectUrl = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = fileName
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Yuklab olish muvaffaqiyatsiz')
    }
  }

  function uploadBasename(rel: string | null | undefined) {
    if (!rel) return ''
    const tail = rel.split('/').pop() ?? ''
    return tail ? decodeURIComponent(tail) : ''
  }

  function pathLooksPdf(rel: string | null | undefined) {
    return Boolean(rel?.toLowerCase().endsWith('.pdf'))
  }

  if (!token)
    return <p className="text-[var(--color-text-muted)]">Kirish talab qilinadi.</p>

  return (
    <div className="space-y-8">
      {backNav ? (
        <Link
          to={backNav.to}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300"
        >
          ← {backNav.label}
        </Link>
      ) : null}

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{subtitle}</p>
        ) : null}
      </div>

      {err ? <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</p> : null}

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
      ) : payload ? (
        <>
          <section className="rounded-[1.25rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 sm:p-6">
            <h2 className="font-display font-bold text-[var(--color-text)]">Shaxsiy maʼlumotlar</h2>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Maʼlumotlar va fayllar faqat kabinetda saqlanadi (sayt boshqasiga chiqmaydi). Talaba oʻzi toʻldiradi va
              yuklaydi; administrator ham taʼhirlashi va barchani — boshqa pasport/avatardan tortib, toʻldirilgan
              formalardagi yozuvlar bilan birgalikda — bir PDF da yoki alohida fayllar sifatida{' '}
              <strong className="text-[var(--color-text)]">                  yuklab olishi</strong> mumkin.
            </p>
            {urls.dataExport ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!payload}
                  onClick={() => void downloadCabinetDataExport()}
                  className="rounded-xl border border-teal-500/50 bg-teal-600/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600/30 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Barchani bitta PDF da yuklash
                </button>
                <span className="self-center text-[11px] text-[var(--color-text-muted)]">
                  {adminContactEditable ? (
                    <>
                      F.I.Sh, guruhi, telefon, manzil, fakultet, ichki arxiv yozuvlari — matn qismida; pasport, avatar,
                      maʼlumotnoma PDF si va kabinet yutuqlarining ilovalari oxirida qoʻshiladi. OpenDocument fayllar uchun
                      PDF da izoh sahifasi chiqadi. Fayl nomida talabaning ismi yoziladi.
                    </>
                  ) : (
                    <>
                      Pasport, avatar, kabinetdagi yutuqlar (sertifikat ilovalari) va boshqa PDF/rasmlar — bitta faylda.
                      OpenDocument (.odt va hokazo) uchun PDF da izoh sahifasi chiqadi; asl faylni alohida saqlab qoling.
                    </>
                  )}
                </span>
              </div>
            ) : null}
            {!adminContactEditable ? (
              <div className="mt-4 grid gap-3 text-sm text-[var(--color-text-muted)] sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-[var(--color-text-muted)]">Login:</span>{' '}
                  <span className="font-mono text-[var(--color-text)]">{payload.profile.login}</span>
                </p>
                <p>
                  <span className="font-semibold">Guruh:</span>{' '}
                  {payload.profile.groupName ?? '—'}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs font-mono text-[var(--color-text-muted)]">
                Login: {payload.profile.login}
              </p>
            )}

            {!adminContactEditable ? (
              <p className="mt-4 rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm text-[var(--color-text-muted)]">
                <span className="font-semibold text-teal-300">Reyting balli uchun</span> turnir / sertifikat / sport va
                boshqalarni{' '}
                <Link to="/talaba/yuklash" className="font-bold text-teal-400 underline underline-offset-2">
                  Yuklash
                </Link>{' '}
                sahifasidan yuboring — moderator tasdig‘idan keyin ball qoʻshiladi (standart ball «Sayt sozlamalari»da tur bo‘yicha
                belgilanadi).
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-10">
              <form onSubmit={saveProfile} className="w-full max-w-none min-w-0 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    F.I.SH
                  </label>
                  <input
                    required
                    minLength={3}
                    maxLength={160}
                    className={inputClass}
                    value={draft.fullName}
                    onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Tugʻilgan sana
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                    <div>
                      <label className="sr-only">Yil</label>
                      <select
                        className={inputClass}
                        aria-label="Tugʻilgan yil"
                        value={birthPick.y}
                        onChange={(e) => patchBirthPick('y', e.target.value)}
                      >
                        <option value="">Yil</option>
                        {birthYearOptions.map((yy) => (
                          <option key={yy} value={String(yy)}>
                            {yy}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="sr-only">Oy</label>
                      <select
                        className={inputClass}
                        aria-label="Tugʻilgan oy"
                        value={birthPick.m}
                        onChange={(e) => patchBirthPick('m', e.target.value)}
                      >
                        <option value="">Oy</option>
                        {BIRTH_MONTHS_UZ.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="sr-only">Kun</label>
                      <select
                        className={inputClass}
                        aria-label="Tugʻilgan kun"
                        value={birthPick.d}
                        onChange={(e) => patchBirthPick('d', e.target.value)}
                        disabled={!birthPick.y || !birthPick.m}
                      >
                        <option value="">Kun</option>
                        {Array.from({ length: birthDayCap }, (_, idx) => {
                          const dn = idx + 1
                          const v = String(dn).padStart(2, '0')
                          return (
                            <option key={v} value={v}>
                              {dn}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    Pastdan yil, oy va kunningizni tanlang — oʻzingiz yozish shart emas.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                      Pasport seriyasi
                    </label>
                    <input
                      className={`${inputClass} font-mono uppercase tracking-wider`}
                      maxLength={2}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Masalan AB"
                      inputMode="text"
                      value={draft.passportSeries}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          passportSeries: sanitizePassportSeries(e.target.value),
                        })
                      }
                    />
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Faqat 2 ta harf.</p>
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                      Pasport raqami
                    </label>
                    <input
                      type="tel"
                      className={`${inputClass} font-mono`}
                      maxLength={7}
                      autoComplete="off"
                      placeholder="Masalan 0781060"
                      inputMode="numeric"
                      value={draft.passportNumber}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          passportNumber: sanitizePassportNumber(e.target.value),
                        })
                      }
                    />
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Faqat 7 ta raqam.</p>
                  </div>
                </div>
                {adminContactEditable ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                      Guruh
                    </label>
                    <input
                      className={inputClass}
                      value={draft.groupName}
                      onChange={(e) => setDraft({ ...draft, groupName: e.target.value })}
                    />
                  </div>
                ) : null}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    className={inputClass}
                    maxLength={40}
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-4 min-w-0">
                  <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Yashash manzili
                  </label>
                  {legacyAddressText ? (
                    <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-[var(--color-text)]">
                      <span className="font-semibold text-[var(--color-text)]">Ilgari saqlangan matn:</span>{' '}
                      <span className="whitespace-pre-wrap opacity-95">{legacyAddressText}</span>
                      <span className="mt-1 block text-[11px] text-[var(--color-text-muted)]">
                        Quyidagi qatorlardan tanlash va yangi manzil yozish orqali yangilashingiz mumkin.
                      </span>
                    </p>
                  ) : null}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="min-w-0">
                      <label className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
                        Viloyat
                      </label>
                      <select
                        className={inputClass}
                        aria-label="Viloyat"
                        value={addr.viloyatId}
                        onChange={(e) =>
                          setAddr({
                            ...addr,
                            viloyatId: e.target.value,
                            tumanId: '',
                            mfy: '',
                          })
                        }
                      >
                        <option value="">— Viloyatni tanlang —</option>
                        {uzHierarchy.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nameUz}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
                        Tuman / shahar
                      </label>
                      <select
                        className={inputClass}
                        aria-label="Tuman yoki shahar"
                        disabled={!addr.viloyatId}
                        value={addr.tumanId}
                        onChange={(e) => setAddr({ ...addr, tumanId: e.target.value, mfy: '' })}
                      >
                        <option value="">— Tumanni tanlang —</option>
                        {tumaniForViloyat.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameUz}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
                      MFY (mahalla fuqarolar yigʻinlari)
                    </label>
                    {mahallaLoading ? (
                      <p className="mb-2 text-[11px] text-[var(--color-text-muted)]">Mahalla ro‘yxati yuklanmoqda…</p>
                    ) : null}
                    {mahallaChoices.length > 0 ? (
                      <select
                        className={inputClass}
                        aria-label="MFY mahalla"
                        disabled={!addr.tumanId}
                        value={mfDropdownValue}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === MFY_OTHER) setAddr({ ...addr, mfy: '' })
                          else setAddr({ ...addr, mfy: v })
                        }}
                      >
                        <option value="">— MFY tanlang —</option>
                        {mahallaChoices.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                        <option value={MFY_OTHER}>Roʻyxatda yoʻq — nomini yozaman</option>
                      </select>
                    ) : null}
                    {showMfyFreeText ? (
                      <input
                        className={`${inputClass} ${mahallaChoices.length > 0 ? 'mt-2' : ''}`}
                        aria-label="MFY nomini yozish"
                        disabled={!addr.tumanId}
                        maxLength={200}
                        placeholder="Mahalla MFY nomi"
                        autoComplete="off"
                        value={addr.mfy}
                        onChange={(e) => setAddr({ ...addr, mfy: e.target.value })}
                      />
                    ) : null}
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                      Avval viloyat va tumanni tanlang. Mahalla uchun tayyor roʻyxat bo‘lmasa, nomni qoʻlda yozing.
                    </p>
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
                      Koʻcha nomi va uy / xonadon
                    </label>
                    <input
                      className={inputClass}
                      maxLength={260}
                      disabled={!addr.tumanId}
                      placeholder="Masalan: Navoiy koʻchasi, 12-uy"
                      autoComplete="street-address"
                      value={addr.street}
                      onChange={(e) => setAddr({ ...addr, street: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                      Fakultet
                    </label>
                    <input
                      className={inputClass}
                      maxLength={200}
                      value={draft.faculty}
                      onChange={(e) => setDraft({ ...draft, faculty: e.target.value })}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                      Taʼlim yoʻnalishi
                    </label>
                    <input
                      className={inputClass}
                      maxLength={200}
                      value={draft.studyDirection}
                      onChange={(e) => setDraft({ ...draft, studyDirection: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingProf}
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingProf ? 'Saqlanmoqda…' : 'Profilni saqlash'}
                </button>
              </form>

              <div className="w-full min-w-0 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/30 p-5 sm:p-6">
                <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                  Profil rasmi va pasportlar
                </h3>
                <p className="mt-2 max-w-2xl text-xs text-[var(--color-text-muted)]">
                  Avatar, pasport skanlari va ixtiyoriy maʼlumotnoma — alohida blokda, keng joyda.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:gap-8">
                  <div className="min-w-0 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/80 p-4">
                    {payload.profile.avatarPath ? (
                      <AuthedAvatarCircleCover
                        token={token}
                        apiPath={urls.cabinetFile('avatar')}
                        alt="Profil rasmi"
                        sizeClass="h-28 w-28"
                        ringClassName="border border-[var(--color-border-subtle)]"
                        className="bg-[var(--color-bg-deep)]"
                      />
                    ) : (
                      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] text-3xl text-[var(--color-text-muted)]">
                        ?
                      </div>
                    )}
                    <label className="mt-3 block w-full max-w-[11rem] cursor-pointer rounded-lg border border-teal-500/50 bg-teal-600/90 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-teal-600">
                      Profil rasmi tanlash
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => void uploadAvatar(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!payload.profile.avatarPath}
                      onClick={() =>
                        void authDownloadCabinet(
                          'avatar',
                          uploadBasename(payload.profile.avatarPath) || `avatar_${payload.profile.login}.jpg`,
                        )
                      }
                      className="mt-2 block w-full max-w-[11rem] rounded-lg border border-slate-500/40 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-200 transition hover:bg-slate-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Yuklab olish
                    </button>
                  </div>

                  <div className="min-w-0 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Pasport — old sahifasi
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {payload.profile.passportPhotoFrontPath && !pathLooksPdf(payload.profile.passportPhotoFrontPath) ? (
                        <AuthedAvatarCircleCover
                          token={token}
                          apiPath={urls.cabinetFile('passport-front')}
                          alt="Pasport old"
                          sizeClass="h-14 w-14"
                          ringClassName="border border-[var(--color-border-subtle)]"
                        />
                      ) : payload.profile.passportPhotoFrontPath && pathLooksPdf(payload.profile.passportPhotoFrontPath) ? (
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/10 text-[10px] font-bold text-[var(--color-text)]">
                          PDF
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-muted)]">
                          —
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <label className={filePickTriggerLabelClass}>
                          Yuklash / almashtirish
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
                            className="hidden"
                            onChange={(e) => void uploadPassport('front', e.target.files?.[0] ?? null)}
                          />
                        </label>
                        {payload.profile.passportPhotoFrontPath ? (
                          <button
                            type="button"
                            onClick={() =>
                              void authDownloadCabinet(
                                'passport-front',
                                uploadBasename(payload.profile.passportPhotoFrontPath) ||
                                  `pasport_old_${payload.profile.login}.pdf`,
                              )
                            }
                            className="rounded-lg border border-teal-500/40 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent-strong)] transition hover:bg-teal-600/25"
                          >
                            To‘liq yuklab olish
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Pasport — orqa sahifasi
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {payload.profile.passportPhotoBackPath && !pathLooksPdf(payload.profile.passportPhotoBackPath) ? (
                        <AuthedAvatarCircleCover
                          token={token}
                          apiPath={urls.cabinetFile('passport-back')}
                          alt="Pasport orqa"
                          sizeClass="h-14 w-14"
                          ringClassName="border border-[var(--color-border-subtle)]"
                        />
                      ) : payload.profile.passportPhotoBackPath && pathLooksPdf(payload.profile.passportPhotoBackPath) ? (
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/10 text-[10px] font-bold text-[var(--color-text)]">
                          PDF
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-muted)]">
                          —
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <label className={filePickTriggerLabelClass}>
                          Yuklash / almashtirish
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
                            className="hidden"
                            onChange={(e) => void uploadPassport('back', e.target.files?.[0] ?? null)}
                          />
                        </label>
                        {payload.profile.passportPhotoBackPath ? (
                          <button
                            type="button"
                            onClick={() =>
                              void authDownloadCabinet(
                                'passport-back',
                                uploadBasename(payload.profile.passportPhotoBackPath) ||
                                  `pasport_arka_${payload.profile.login}.pdf`,
                              )
                            }
                            className="rounded-lg border border-teal-500/40 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent-strong)] transition hover:bg-teal-600/25"
                          >
                            To‘liq yuklab olish
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-xl border border-teal-500/25 bg-[var(--color-bg-deep)]/80 p-4 sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent-strong)]">
                      Yakuniy maʼlumotnoma (PDF)
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-[var(--color-text-muted)]">
                      {urls.summaryPdfPost ? (
                        urls.dataExport ? (
                          <>
                            Butun kabinetni (matnlar, avatar, pasport, maʼlumotnoma va ichki arxiv ilovalari) bitta PDF da
                            olish uchun yuqoridagi «Barchani bitta PDF da yuklash»dan foydalaning. Bu yerda esa faqat
                            alohida maʼlumotnoma PDF ini yuklaysiz yoki olasiz.
                          </>
                        ) : (
                          <>
                            Barcha toʻldirilgan shaxsiy maʼlumotlar toʻplamini bir faylda saqlamoqchi boʻlsangiz, bitta PDF
                            yuklang. Administrator uni shu tugma orqali toʻliq yuklab oladi.
                          </>
                        )
                      ) : (
                        <>
                          Yakuniy maʼlumotnoma PDF ini faqat administrator yuklaydi yoki yangilaydi. Agar u siz uchun
                          yuklangan boʻlsa, quyidagi faylni yuklab olishingiz mumkin.
                        </>
                      )}
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {payload.profile.cabinetSummaryPdfPath ? (
                        <>
                          <p className="break-all font-mono text-[11px] text-[var(--color-text-muted)]">
                            {uploadBasename(payload.profile.cabinetSummaryPdfPath)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={summaryPdfBusy}
                              onClick={() =>
                                void authDownloadCabinet(
                                  'summary-pdf',
                                  uploadBasename(payload.profile.cabinetSummaryPdfPath) ||
                                    `talaba-malumotnoma_${payload.profile.login}.pdf`,
                                )
                              }
                              className="rounded-lg border border-teal-500/45 bg-teal-600/20 px-3 py-1.5 text-[11px] font-semibold text-teal-50 transition hover:bg-teal-600/35 disabled:opacity-40"
                            >
                              Maʼlumotnomani yuklab olish
                            </button>
                            {urls.summaryPdfDelete ? (
                              <button
                                type="button"
                                disabled={summaryPdfBusy}
                                onClick={() => void removeCabinetSummaryPdf()}
                                className="rounded-lg border border-red-500/40 px-3 py-1.5 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-40"
                              >
                                PDF ni o‘chirish
                              </button>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-[var(--color-text-muted)]">Hali PDF yuklanmagan.</p>
                      )}
                      {urls.summaryPdfPost ? (
                        <label className={filePickTriggerLabelClass}>
                          {summaryPdfBusy ? 'Kutilmoqda…' : 'PDF tanlash'}
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            disabled={summaryPdfBusy}
                            className="hidden"
                            onChange={(e) =>
                              void uploadCabinetSummaryPdfFile(e.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <p className="text-[var(--color-text-muted)]">Maʼlumot yo‘q</p>
      )}
    </div>
  )
}
