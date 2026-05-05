import { type FormEvent, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiUrl } from '@/lib/api'
import { nativeFileInputClass } from '@/lib/fileFieldStyles'

type SubmissionKindUi =
  | 'CERTIFICATE'
  | 'OLYMPIAD'
  | 'CONFERENCE'
  | 'STARTUP'
  | 'SPORT'
  | 'VOLUNTEERING'
  | 'EVENT'
  | 'SCHOLARSHIP'
  | 'EXCELLENCE'
  | 'ARTICLE'

export function StudentUploadPage() {
  const { token } = useAuth()
  const [kind, setKind] = useState<SubmissionKindUi>('CERTIFICATE')
  const [studentStory, setStudentStory] = useState('')
  const [title, setTitle] = useState('')
  const [orgName, setOrgName] = useState('')
  const [issuedAt, setIssuedAt] = useState('')
  const [legacyNote, setLegacyNote] = useState('')
  const [articleJournalTier, setArticleJournalTier] = useState<'REPUBLIC' | 'INTERNATIONAL'>(
    'REPUBLIC',
  )
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [sending, setSending] = useState(false)

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
        text: 'Kamida 4 belgidan iborat «Yutuqlar haqida yozma bayon» yozing yoki sarlavha va tashkilotni toʻldirib yuboring.',
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
        Nizom boʻyicha 10 taʼsir yoʻnalishi haqidagi yuklamalar uchun (har biri uchun 1–10 ballgacha yakunlangan
        material). Umumiy maksimal 100 ball toʻplanadi. Materiāl rasmiy sarlavha va izoh uchun AI yordami ishlatilishi mumkin — yakuniy ruxsat va ball moderator zimmasida.
      </p>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 sm:p-6"
      >
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-muted)]">Mezon yoʻnalishi (10 taʼsir yoʻnalishidan biri)</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SubmissionKindUi)}
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
          >
            <option value="CERTIFICATE">Til / sertifikat</option>
            <option value="OLYMPIAD">Olimpiadadagi oʻrin</option>
            <option value="CONFERENCE">Konferensiya ishtiroki</option>
            <option value="STARTUP">Startap gʻoyasi</option>
            <option value="SPORT">Sport yutuqi</option>
            <option value="VOLUNTEERING">Volontyorlik</option>
            <option value="EVENT">Maʼnaviy-maʼrifiy tadbir</option>
            <option value="SCHOLARSHIP">Nomli stipendiya</option>
            <option value="EXCELLENCE">{`A'lochi talaba`}</option>
            <option value="ARTICLE">Ilmiy maqola</option>
          </select>
          {kind === 'ARTICLE' ? (
            <div className="mt-3">
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]"> Nashr zonasi </label>
              <select
                value={articleJournalTier}
                onChange={(e) => setArticleJournalTier(e.target.value as 'REPUBLIC' | 'INTERNATIONAL')}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
              >
                <option value="REPUBLIC">Respublika jurnali (maks. 5 ball tartibida)</option>
                <option value="INTERNATIONAL">Xalqaro jurnal (maks. 10 ball tartibida)</option>
              </select>
            </div>
          ) : null}
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
            Alternativa: kamida 4 belgi yozmasdan, faqat aniq «Sarlavha» va «Tashkilot» bilan yuboring — AI oʻsha asosda toʻliq matn tuzadi.
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
            Tashkilot <span className="opacity-70">(ixtiyoriy)</span>
          </label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)]"
          />
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
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={`${nativeFileInputClass} file:border-emerald-600/50 file:bg-emerald-600 file:text-white file:shadow-emerald-900/20 hover:file:border-emerald-500 hover:file:bg-emerald-500 dark:file:bg-emerald-700 dark:hover:file:bg-emerald-600`}
          />
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
