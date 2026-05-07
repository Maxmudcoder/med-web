import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { RequireRole } from '@/components/RequireRole'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AdminLayout } from '@/layouts/AdminLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { HomePage } from '@/pages/public/HomePage'
import { RankingPage } from '@/pages/public/RankingPage'
import { AnnouncementsPage } from '@/pages/public/AnnouncementsPage'
import { TeachersPage } from '@/pages/public/TeachersPage'
import { ContactPage } from '@/pages/public/ContactPage'
import { PublicPortfolioPage } from '@/pages/public/PublicPortfolioPage'
import { LoginPage } from '@/pages/LoginPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminStudentsPage } from '@/pages/admin/AdminStudentsPage'
import { AdminStudentCabinetPage } from '@/pages/admin/AdminStudentCabinetPage'
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage'
import { AdminAppealsPage } from '@/pages/admin/AdminAppealsPage'
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage'
import { AdminStudentMessagePage } from '@/pages/admin/AdminStudentMessagePage'
import { AdminContactMessagesPage } from '@/pages/admin/AdminContactMessagesPage'
import { AdminTeachersPage } from '@/pages/admin/AdminTeachersPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage'
import { StudentUploadPage } from '@/pages/student/StudentUploadPage'
import { StudentSettingsPage } from '@/pages/student/StudentSettingsPage'
import { StudentCabinetPage } from '@/pages/student/StudentCabinetPage'
import { StudentAppealsPage } from '@/pages/student/StudentAppealsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/reyting" element={<RankingPage />} />
                <Route path="/elonlar" element={<AnnouncementsPage />} />
                <Route path="/oqituvchilar" element={<TeachersPage />} />
                <Route path="/aloqa" element={<ContactPage />} />
                <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />
              </Route>
              <Route path="/kirish" element={<LoginPage />} />
              <Route
                path="/admin"
                element={
                  <RequireRole role="ADMIN">
                    <AdminLayout />
                  </RequireRole>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="talabalar" element={<AdminStudentsPage />} />
                <Route path="talabalar/:studentId/profil" element={<AdminStudentCabinetPage />} />
                <Route path="moderatsiya" element={<Navigate to="/admin/baholash" replace />} />
                <Route path="baholash" element={<AdminModerationPage />} />
                <Route path="shikoyatlar" element={<AdminAppealsPage />} />
                <Route path="ai-yordamchi" element={<Navigate to="/admin" replace />} />
                <Route path="elonlar" element={<AdminAnnouncementsPage />} />
                <Route path="talaba-xabar" element={<AdminStudentMessagePage />} />
                <Route path="xabarlar" element={<AdminContactMessagesPage />} />
                <Route path="sozlamalar" element={<AdminSettingsPage />} />
                <Route path="oqituvchilar" element={<AdminTeachersPage />} />
              </Route>
              <Route
                path="/talaba"
                element={
                  <RequireRole role="STUDENT">
                    <StudentLayout />
                  </RequireRole>
                }
              >
                <Route index element={<StudentDashboardPage />} />
                <Route path="dastur" element={<Navigate to="/talaba" replace />} />
                <Route path="rivojlanish" element={<Navigate to="/talaba" replace />} />
                <Route path="portfolio" element={<Navigate to="/talaba" replace />} />
                <Route path="sertifikatlar" element={<Navigate to="/talaba" replace />} />
                <Route path="yuklash" element={<StudentUploadPage />} />
                <Route path="shikoyatlar" element={<StudentAppealsPage />} />
                <Route path="profil" element={<StudentCabinetPage />} />
                <Route path="sozlamalar" element={<StudentSettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}
