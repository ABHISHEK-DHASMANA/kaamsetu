import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AboutPage } from './pages/AboutPage';
import { JobsExplorePage } from './pages/JobsExplorePage';
import { WorkersExplorePage } from './pages/WorkersExplorePage';
import { PublicPassportPage } from './pages/PublicPassportPage';

// Worker Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerFindJobs } from './pages/worker/WorkerFindJobs';
import { WorkerApplications } from './pages/worker/WorkerApplications';
import { WorkerSkillPassport } from './pages/worker/WorkerSkillPassport';
import { WorkerProfilePage } from './pages/worker/WorkerProfile';
import { ChatPage } from './pages/shared/ChatPage';
import { SavedJobsPage } from './pages/worker/SavedJobsPage';
import { PaymentsPage } from './pages/shared/PaymentsPage';

// Employer Pages
import { EmployerDashboard } from './pages/employer/EmployerDashboard';
import { EmployerPostJob } from './pages/employer/EmployerPostJob';
import { EmployerManageJobs } from './pages/employer/EmployerManageJobs';
import { EmployerCandidates } from './pages/employer/EmployerCandidates';
import { EmployerProfilePage } from './pages/employer/EmployerProfile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminJobs } from './pages/admin/AdminJobs';
import { AdminReports } from './pages/admin/AdminReports';

// Role-protected route wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate panel
    if (user.role === 'worker') return <Navigate to="/worker/dashboard" replace />;
    if (user.role === 'employer') return <Navigate to="/employer/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/jobs" element={<JobsExplorePage />} />
      <Route path="/workers" element={<WorkersExplorePage />} />
      <Route path="/passport/:passportId" element={<PublicPassportPage />} />

      {/* Worker Routes */}
      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute allowedRoles={['worker', 'admin']}>
            <WorkerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/find-jobs"
        element={
          <ProtectedRoute allowedRoles={['worker', 'admin']}>
            <WorkerFindJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/applications"
        element={
          <ProtectedRoute allowedRoles={['worker', 'admin']}>
            <WorkerApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/skill-passport"
        element={
          <ProtectedRoute allowedRoles={['worker', 'admin']}>
            <WorkerSkillPassport />
          </ProtectedRoute>
        }
      />
      <Route path="/chats" element={<ProtectedRoute allowedRoles={['worker','employer']}><ChatPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute allowedRoles={['worker','employer']}><PaymentsPage /></ProtectedRoute>} />
      <Route path="/worker/saved-jobs" element={<ProtectedRoute allowedRoles={['worker']}><SavedJobsPage /></ProtectedRoute>} />
      <Route
        path="/worker/profile"
        element={
          <ProtectedRoute allowedRoles={['worker', 'admin']}>
            <WorkerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Employer Routes */}
      <Route
        path="/employer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['employer', 'admin']}>
            <EmployerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/post-job"
        element={
          <ProtectedRoute allowedRoles={['employer', 'admin']}>
            <EmployerPostJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/manage-jobs"
        element={
          <ProtectedRoute allowedRoles={['employer', 'admin']}>
            <EmployerManageJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/candidates"
        element={
          <ProtectedRoute allowedRoles={['employer', 'admin']}>
            <EmployerCandidates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/profile"
        element={
          <ProtectedRoute allowedRoles={['employer', 'admin']}>
            <EmployerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminReports />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
