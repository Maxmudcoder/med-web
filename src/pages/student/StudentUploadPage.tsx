import { type FormEvent, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiUrl } from '@/lib/api'
import { nativeFileInputClass } from '@/lib/fileFieldStyles'
import {
  NIZOM_DIRECTION_HINTS,
  STUDENT_UPLOAD_KIND_ORDER,
  type StudentUploadKind,
} from '@/student/studentSubmissionUi'

type SubmissionKindUi = StudentUploadKind

export function StudentUploadPage() {
  const { token } = useAuth()
  const [kind, setKind] = useState<SubmissionKindUi>('CERTIFICATE')
  const [studentStory, setStudentStory] = useState('')
  const [title, setTitle] = useState('')
  const [orgName, setOrgName] = useState('')
  const [scientificSupervisor, setScientificSupervisor] = useState('')
  const [issuedAt, setIssuedAt] = useState('')
  const [legacyNote, setLegacyNote] = useState('')
  const [articleJournalTier, setArticleJournalTier] = useState<'REPUBLIC' | 'INTERNATIONAL'>(
    'REPUBLIC',
  )
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [sending, setSending] = useState(false)

  const kindDetail = NIZOM_DIRECTION_HINTS[kind]

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!file || !token) {
      setMsg({ ok: false, text: 'Fayl va tizimga kirish zarur.' })
      return
    }
    const story = studentStory.trim()
    const hintsOk = title.trim().length >= 2 && orgName.trim().length >= 2
    if (story.length < 4 && !hintsOk) {
      setMsg({
        ok: false,
        text: 'Kamida 4 belgidan iborat «Yutuqlar haqida yozma bayon» yozing yoki sarlavha va mashgʻulot / tashkilotni toʻldirib yuboring.',
      })
      return
    }
    setSending(true)
    try {
      const fd = new FormData()
      fd.set('kind', kind)
      if (kind === 'ARTICLE') fd.set('articleJournalTier', articleJournalTier)
      fd.set('studentStory', studentStory)
      fd.set('title', title)
      fd.set('orgName', orgName)
      fd.set('issuedAt', issuedAt)
      const sup = scientificSupervisor.trim()
      if (sup.length >= 2) fd.set('scientificSupervisor', sup.slice(0, 200))
      if (legacyNote.trim()) fd.set('note', legacyNote)
      fd.set('file', file)
      const res = await fetch(apiUrl('/api/student/submissions'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = (await res.json()) as {
        error?: string
        aiSuggestedPoints?: number | null
        aiAssessment?: string | null
        aiScoreUsedOpenAi?: boolean
        adminNotified?: boolean
        adminRecipients?: number
      }
      if (!res.ok) throw new Error(data.error || 'Yuborish muvaffaqiyatsiz')
      const bits: string[] = [
        'Muvaffaqiyatli yuborildi. Material moderatsiya navbatiga qo‘yildi; administrator bildirishnoma oladi. Ochiq reytingda chiqishi faqat moderator yakuniy tasdig‘idan keyin mumkin.',
      ]
      if (data.adminNotified === false && (data.adminRecipients ?? 0) > 0) {
        bits.push(' Ogohlantirish: administratorlar bildirishnomasi yuborilmadi — texnik xizmatga xabar bering.')
      } else if ((data.adminRecipients ?? 0) === 0) {
        bits.push(
          ' Ogohlantirish: tizimda faol administrator akkaunti yoʻq — «Baholash» navbatiga qaramay, kimdir kirishi kerak.',
        )
      }
      if (data.aiScoreUsedOpenAi === false) {
        bits.push(
          ' Diqqat: serverda GPT kaliti ishlamayotgani uchun ball tavsiyasi hozircha taxminiy — administrator «AI qayta hisoblash» orqali haqiqiy tahlil olishi kerak.',
        )
      }
      if (data.aiSuggestedPoints != null) {
        bits.push(
          ` Taxminiy tavsiya balli (yakuniy emas): ${data.aiSuggestedPoints}. Yakuniy ballni administrator belgilaydi.`,
        )
      }
      if (data.aiAssessment?.trim()) {
        bits.push(` Qisqa tekshuv: ${data.aiAssessment.trim()}`)
      }
      setMsg({ ok: true, text: bits.join('') })
      setStudentStory('')
      setTitle('')
      setOrgName('')
      setScientificSupervisor('')
      setIssuedAt('')
      setLegacyNote('')
      setFile(null)
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Xato',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-lg">
      <h1 className="mb-2 text-xl font-bold text-[var(--color-text)] sm:text-2xl">
        Talaba baholashi — materiāl yuklash
      </h1>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Nizom: har bir taʼsir yoʻnalishi uchun bitta tasdiqlangan material — <strong className="text-[var(--color-text)]">0–10 ball</strong>{' '}
        oralig‘ida. Oʻn yoʻnalish boʻyicha jami reyting maksimumi <strong className="text-[var(--color-text)]">100 ball</strong>. Tur, ilmiy
        rahbar va matnlar AI tahlili hamda moderator tekshiruviga uzatiladi.
      </p>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 sm:p-6"
      >
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
            Mezon yoʻnalishi (dropdown yoki roʻyxatdan tanlang)
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SubmissionKindUi)}
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
          >
            {STUDENT_UPLOAD_KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {NIZOM_DIRECTION_HINTS[k].label}
              </option>
            ))}
          </select>
          {kind === 'ARTICLE' ? (
            <div className="mt-3">
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]"> Nashr zonasi </label>
              <select
                value={articleJournalTier}
                onChange={(e) => setArticleJournalTier(e.target.value as 'REPUBLIC' | 'INTERNATIONAL')}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
              >
                <option value="REPUBLIC">Respublika jurnali (bitta maqola: maks. 10 ball; nizomda xalqarodan pastroq tayanch)</option>
                <option value="INTERNATIONAL">Xalqaro jurnal (bitta maqola: maks. 10 ball; nizomda yuqoriroq tayanch)</option>
              </select>
            </div>
          ) : null}

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            10 taʼsir yoʻnalishi — bittasini bosing (dropdown bilan bir xil)
          </p>
          <ul
            className="mt-2 max-h-[min(22rem,50vh)] space-y-1.5 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/40 p-2"
            role="listbox"
            aria-label="Nizom boʻyicha yoʻnalishlar"
          >
            {STUDENT_UPLOAD_KIND_ORDER.map((k) => {
              const active = kind === k
              const row = NIZOM_DIRECTION_HINTS[k]
              return (
                <li key={k}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => setKind(k)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? 'bg-teal-600/25 font-semibold text-[var(--color-text)] ring-2 ring-teal-500/50'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)]/80 hover:text-[var(--color-text)]'
                    }`}
                  >
                    <span className="block text-[var(--color-text)]">{row.label}</span>
                    <span className="mt-0.5 block text-xs font-normal leading-snug opacity-90">
                      {row.hint}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm text-[var(--color-text)]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600/90 dark:text-teal-300/90">
              Hozir tanlangan: {kindDetail.label}
            </p>
            <p className="mt-1 leading-relaxed text-[var(--color-text-muted)]">{kindDetail.hint}</p>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
            Yutuqlar haqida yozma bayon{' '}
            <span className="text-[var(--color-text-muted)]">(kamida 4 belgi — yoki faqat sarlavha + tashkilot)</span>
          </label>
          <textarea
            required={title.trim().length < 2 || orgName.trim().length < 2}
            value={studentStory}
            onChange={(e) => setStudentStory(e.target.value)}
            rows={5}
            placeholder="Masalan: respublika olimpiadasida ikkinchi oʻrin, fan — biologiya; sertifikat sanasi va tashkilot nomini ham yozing."
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-80"
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Alternativa: kamida 4 belgi yozmasdan, faqat aniq «Sarlavha» va «Tashkilot» bilan yuboring — AI oʻsha asosda
            toʻliq matn tuzadi.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
            Sarlavha <span className="opacity-70">(ixtiyoriy)</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
            Tashkilot / mashgʻulot joyi <span className="opacity-70">(ixtiyoriy)</span>
          </label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
            Ilmiy rahbar yoki masʻul oʻqituvchi <span className="opacity-70">(ixtiyoriy; qoʻlda FIO)</span>
          </label>
          <input
            value={scientificSupervisor}
            onChange={(e) => setScientificSupervisor(e.target.value)}
            maxLength={200}
            placeholder="Masalan: prof. Toshmatov Anvar Rustamovich"
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-80"
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Sertifikat, maqola, konferensiya va boshqa turlar uchun ilmiy rahbarni oʻzingiz yozasiz; mazkur maʼlumot
            bazada saqlanadi, rasmiy izoh va AI ball tahliliga qoʻshimcha sifatida uzatiladi.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Sana</label>
          <input
            type="date"
            required
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
            Qo‘shimcha izoh (ixtiyoriy; AI umumiy matnga qoʻshib rasmiy „note“ga aylantirishi mumkin)
          </label>
          <textarea
            value={legacyNote}
            onChange={(e) => setLegacyNote(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Fayl</label>
          <input
            type="file"
            accept=".pdf,.odt,.odp,.ods,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={`${nativeFileInputClass} file:border-emerald-600/50 file:bg-emerald-600 file:text-white file:shadow-emerald-900/20 hover:file:border-emerald-500 hover:file:bg-emerald-500 dark:file:bg-emerald-700 dark:hover:file:bg-emerald-600`}
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            PDF, JPEG/PNG/WebP yoki OpenDocument (.odt, .odp, .ods). Keyin «Materiallar»dan rasm yoki boshqa formatni bitta
            PDF ga yig‘ish mumkin.
          </p>
        </div>
        <button
          type="submit"
          disabled={sending || !token}
          className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-teal-500/30 disabled:opacity-45"
        >
          {sending ? 'Joʻnatilyapti…' : 'Yuborish'}
        </button>
        {msg ? (
          <p
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.ok
                ? 'border border-teal-500/40 bg-teal-500/10 text-[var(--color-text)]'
                : 'border border-red-500/35 bg-red-500/15 text-[var(--color-text)]'
            }`}
          >
            {msg.text}
          </p>
        ) : null}
      </form>
    </div>
  )
}
