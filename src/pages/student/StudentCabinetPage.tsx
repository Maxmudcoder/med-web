import { CabinetPanel, type CabinetEndpoints } from '@/components/CabinetPanel'
import { useAuth } from '@/context/AuthContext'

const STUDENT_URLS: CabinetEndpoints = {
  load: '/api/student/cabinet',
  profilePatch: '/api/student/cabinet/profile',
  avatar: '/api/student/cabinet/avatar',
  passportFront: '/api/student/cabinet/passport/front',
  passportBack: '/api/student/cabinet/passport/back',
  cabinetFile: (kind) => `/api/student/cabinet/files/${kind}`,
  summaryPdfPost: '/api/student/cabinet/summary-pdf',
  summaryPdfDelete: '/api/student/cabinet/summary-pdf',
  dataExport: '/api/student/cabinet/export',
}

export function StudentCabinetPage() {
  const { token } = useAuth()
  return (
    <CabinetPanel
      token={token}
      urls={STUDENT_URLS}
      adminContactEditable={false}
      title="Shaxsiy kabinet"
      subtitle="Profil, pasport (rasm yoki PDF skan), yakuniy maʼlumotnoma PDF si va ichki arxiv yutuqlari kabinetda saqlanadi. Bitta PDF da barchasini (matn + rasmlar + yuklangan hujjatlar) yuklab olish mumkin. Reyting uchun materiallarni «Yuklash» sahifasidan yuboring."
    />
  )
}
