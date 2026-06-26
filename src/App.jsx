import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Member pages
import Home from './pages/Home';
import Apply from './pages/Apply';
import ApplyKYC from './pages/ApplyKYC';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import Services from './pages/Services';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import MemberDocuments from './pages/MemberDocuments';

// Admin pages (Operations Center)
import AdminOverview from './pages/admin/AdminOverview';
import AdminApplications from './pages/admin/AdminApplications';
import AdminKYC from './pages/admin/AdminKYC';
import AdminMembers from './pages/admin/AdminMembers';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminAgent from './pages/admin/AdminAgent';

// Operations Center pages
import Organizations from './pages/operations/Organizations';
import Finance from './pages/operations/Finance';
import Deposits from './pages/operations/Deposits';
import Transfers from './pages/operations/Transfers';
import OperationsDocuments from './pages/operations/OperationsDocuments';
import Cards from './pages/operations/Cards';
import WalletAssignment from './pages/operations/WalletAssignment';
import AccountAssignment from './pages/operations/AccountAssignment';
import Reports from './pages/operations/Reports';
import ExecutiveReports from './pages/operations/ExecutiveReports';
import AuditLogs from './pages/operations/AuditLogs';
import ActivityTimeline from './pages/operations/ActivityTimeline';
import Configuration from './pages/operations/Configuration';
import ApiManagement from './pages/operations/ApiManagement';
import Integrations from './pages/operations/Integrations';
import OperationsNotifications from './pages/operations/OperationsNotifications';
import Security from './pages/operations/Security';
import FeatureFlags from './pages/operations/FeatureFlags';
import BackgroundJobs from './pages/operations/BackgroundJobs';
import SystemHealth from './pages/operations/SystemHealth';

// Layouts & Guards
import MemberLayout from './components/vantoris/MemberLayout';
import AdminLayout from './components/vantoris/AdminLayout';
import OperationsRoute from './components/OperationsRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0E1A2B]">
        <div className="w-8 h-8 border-2 border-[#B08D57]/30 border-t-[#B08D57] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Member routes */}
        <Route element={<MemberLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/documents" element={<MemberDocuments />} />
        </Route>

        {/* Non-layout member routes */}
        <Route path="/apply" element={<Apply />} />
        <Route path="/apply/kyc" element={<ApplyKYC />} />

        {/* Backward-compatible redirect */}
        <Route path="/admin/*" element={<Navigate to="/operations" replace />} />

        {/* Operations Center routes */}
        <Route element={<OperationsRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/operations" element={<AdminOverview />} />
            <Route path="/operations/applications" element={<AdminApplications />} />
            <Route path="/operations/kyc" element={<AdminKYC />} />
            <Route path="/operations/members" element={<AdminMembers />} />
            <Route path="/operations/accounts" element={<AdminAccounts />} />
            <Route path="/operations/withdrawals" element={<AdminWithdrawals />} />
            <Route path="/operations/assistant" element={<AdminAgent />} />
            <Route path="/operations/organizations" element={<Organizations />} />
            <Route path="/operations/finance" element={<Finance />} />
            <Route path="/operations/deposits" element={<Deposits />} />
            <Route path="/operations/transfers" element={<Transfers />} />
            <Route path="/operations/documents" element={<OperationsDocuments />} />
            <Route path="/operations/cards" element={<Cards />} />
            <Route path="/operations/wallet-assignment" element={<WalletAssignment />} />
            <Route path="/operations/account-assignment" element={<AccountAssignment />} />
            <Route path="/operations/reports" element={<Reports />} />
            <Route path="/operations/executive-reports" element={<ExecutiveReports />} />
            <Route path="/operations/audit-logs" element={<AuditLogs />} />
            <Route path="/operations/activity" element={<ActivityTimeline />} />
            <Route path="/operations/configuration" element={<Configuration />} />
            <Route path="/operations/api-management" element={<ApiManagement />} />
            <Route path="/operations/integrations" element={<Integrations />} />
            <Route path="/operations/notifications" element={<OperationsNotifications />} />
            <Route path="/operations/security" element={<Security />} />
            <Route path="/operations/feature-flags" element={<FeatureFlags />} />
            <Route path="/operations/background-jobs" element={<BackgroundJobs />} />
            <Route path="/operations/system-health" element={<SystemHealth />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App