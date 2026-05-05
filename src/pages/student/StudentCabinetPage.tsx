import { CabinetPanel, type CabinetEndpoints } from '@/components/CabinetPanel'
import { useAuth } from '@/context/AuthContext'

const STUDENT_URLS: CabinetEndpoints = {
  load: '/api/student/cabinet',
  profilePatch: '/api/student/cabinet/profile',
  avatar: '/api/student/cabinet/avatar',
  passportFront: '/api/student/cabinet/passport/front',
  passportBack: '/api/student/cabinet/passport/back',
  achievements: '/api/student/cabinet/achievements',
  achievement: (id) => `/api/student/cabinet/achievements/${encodeURIComponent(id)}`,
  achievementFile: (id) => `/api/student/cabinet/achievements/${encodeURIComponent(id)}/file`,
  cabinetFile: (kind) => `/api/student/cabinet/files/${kind}`,
  summaryPdfPost: '/api/student/cabinet/summary-pdf',
  summaryPdfDelete: '/api/student/cabinet/summary-pdf',
}

export function StudentCabinetPage() {
  const { token } = useAuth()
  return (
    <CabinetPanel
      token={token}
      urls={STUDENT_URLS}
      adminContactEditable={false}
      title="Shaxsiy kabinet"
      subtitle="Profil, pasport (rasm yoki PDF skan), yakuniy maʼlumotnoma PDF si, telefon, manzil, fakultet va yoʻnalish — kabinetda saqlanadi. Administrator kirganda tashqariga chiqmaydi. Reyting uchun materiallarni «Yuklash» sahifasidan yuboring (AI + administrator)."
    />
  )
}
