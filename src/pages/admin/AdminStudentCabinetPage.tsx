import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CabinetPanel, type CabinetEndpoints } from '@/components/CabinetPanel'
import { useAuth } from '@/context/AuthContext'

export function AdminStudentCabinetPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const { token } = useAuth()

  const urls: CabinetEndpoints = useMemo(() => {
    const b = `/api/admin/students/${encodeURIComponent(studentId ?? '')}/cabinet`
    return {
      load: b,
      profilePatch: `${b}/profile`,
      avatar: `${b}/avatar`,
      passportFront: `${b}/passport/front`,
      passportBack: `${b}/passport/back`,
      achievements: `${b}/achievements`,
      achievement: (id) => `${b}/achievements/${encodeURIComponent(id)}`,
      achievementFile: (id) => `${b}/achievements/${encodeURIComponent(id)}/file`,
      cabinetFile: (kind) => `${b}/files/${kind}`,
      summaryPdfPost: `${b}/summary-pdf`,
      summaryPdfDelete: `${b}/summary-pdf`,
      dataExport: `${b}/export`,
    }
  }, [studentId])

  if (!studentId) return <Navigate to="/admin/talabalar" replace />

  return (
    <CabinetPanel
      token={token}
      urls={urls}
      adminContactEditable
      title="Talaba kabineti"
      subtitle="Talaba profili: bitta PDF da barcha matn, pasport/avatar va yuklangan PDF lar; fayl nomida talabaning ismi chiqadi. Zarur boʻlsa alohida tugmalar bilan ham olish mumkin."
      backNav={{ to: '/admin/talabalar', label: 'Talabalar roʻyxati' }}
    />
  )
}
