import React, { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import MemberRoute from '@/components/MemberRoute';
import PageTransition from './components/vantoris/PageTransition';

// Layouts & Guards (non-lazy — needed for route structure)
import MemberLayout from './components/vantoris/MemberLayout';
import AdminLayout from './components/vantoris/AdminLayout';
import OperationsRoute from './components/OperationsRoute';

// Lazy-loaded pages — Auth
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

// Lazy-loaded pages — Member
const AIAssistantHome = React.lazy(() => import('./pages/AIAssistantHome'));
const Home = React.lazy(() => import('./pages/Home'));
const Apply = React.lazy(() => import('./pages/Apply'));
const ApplyKYC = React.lazy(() => import('./pages/ApplyKYC'));
const Accounts = React.lazy(() => import('./pages/Accounts'));
const AccountDetail = React.lazy(() => import('./pages/AccountDetail'));
const Services = React.lazy(() => import('./pages/Services'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Profile = React.lazy(() => import('./pages/Profile'));
const MemberDocuments = React.lazy(() => import('./pages/MemberDocuments'));
const MemberAdvisor = React.lazy(() => import('./pages/MemberAdvisor'));
const Trading = React.lazy(() => import('./pages/Trading'));
const MoveMoney = React.lazy(() => import('./pages/MoveMoney'));
const Investments = React.lazy(() => import('./pages/Investments'));
const More = React.lazy(() => import('./pages/More'));
const TransactionDispute = React.lazy(() => import('./pages/TransactionDispute'));
const BrandIdentity = React.lazy(() => import('./pages/BrandIdentity'));

// Lazy-loaded pages — Admin (Operations Center)
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const ExecutiveDashboard = React.lazy(() => import('./pages/operations/ExecutiveDashboard'));
const SecurityComplianceDashboard = React.lazy(() => import('./pages/operations/SecurityComplianceDashboard'));
const AdminApplications = React.lazy(() => import('./pages/admin/AdminApplications'));
const AdminKYC = React.lazy(() => import('./pages/admin/AdminKYC'));
const AdminMembers = React.lazy(() => import('./pages/admin/AdminMembers'));
const AdminAccounts = React.lazy(() => import('./pages/admin/AdminAccounts'));
const AdminWithdrawals = React.lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminAgent = React.lazy(() => import('./pages/admin/AdminAgent'));

// Lazy-loaded pages — Operations Center
const WithdrawalLimits = React.lazy(() => import('./pages/operations/WithdrawalLimits'));
const Organizations = React.lazy(() => import('./pages/operations/Organizations'));
const Finance = React.lazy(() => import('./pages/operations/Finance'));
const Deposits = React.lazy(() => import('./pages/operations/Deposits'));
const Transfers = React.lazy(() => import('./pages/operations/Transfers'));
const OperationsDocuments = React.lazy(() => import('./pages/operations/OperationsDocuments'));
const Cards = React.lazy(() => import('./pages/operations/Cards'));
const WalletAssignment = React.lazy(() => import('./pages/operations/WalletAssignment'));
const ResponseTemplates = React.lazy(() => import('./pages/operations/ResponseTemplates'));
const AccountAssignment = React.lazy(() => import('./pages/operations/AccountAssignment'));
const Reports = React.lazy(() => import('./pages/operations/Reports'));
const ExecutiveReports = React.lazy(() => import('./pages/operations/ExecutiveReports'));
const AuditLogs = React.lazy(() => import('./pages/operations/AuditLogs'));
const ActivityTimeline = React.lazy(() => import('./pages/operations/ActivityTimeline'));
const VerificationRequests = React.lazy(() => import('./pages/operations/VerificationRequests'));
const ServiceRequests = React.lazy(() => import('./pages/operations/ServiceRequests'));
const MemberMessages = React.lazy(() => import('./pages/operations/MemberMessages'));
const OperationalProfiles = React.lazy(() => import('./pages/operations/OperationalProfiles'));
const Referrals = React.lazy(() => import('./pages/operations/Referrals'));
const Configuration = React.lazy(() => import('./pages/operations/Configuration'));
const ApiManagement = React.lazy(() => import('./pages/operations/ApiManagement'));
const Integrations = React.lazy(() => import('./pages/operations/Integrations'));
const OperationsNotifications = React.lazy(() => import('./pages/operations/OperationsNotifications'));
const Security = React.lazy(() => import('./pages/operations/Security'));
const FeatureFlags = React.lazy(() => import('./pages/operations/FeatureFlags'));
const BackgroundJobs = React.lazy(() => import('./pages/operations/BackgroundJobs'));
const SystemHealth = React.lazy(() => import('./pages/operations/SystemHealth'));

const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingFallback />;
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
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<PageTransition />}>
          <Route path="/login" element={<Login />} />
          <Route path="/brand" element={<BrandIdentity />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          {/* Member routes — staff/admins are redirected to Operations */}
          <Route element={<MemberRoute />}>
            <Route element={<MemberLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/advisor/home" element={<AIAssistantHome />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/:id" element={<AccountDetail />} />
              <Route path="/services" element={<Services />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/documents" element={<MemberDocuments />} />
              <Route path="/advisor" element={<MemberAdvisor />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/move-money" element={<MoveMoney />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/more" element={<More />} />
              <Route path="/transaction-dispute" element={<TransactionDispute />} />
              <Route path="/guide" element={<MemberAdvisor />} />
            </Route>

            {/* Non-layout member routes */}
            <Route element={<PageTransition />}>
              <Route path="/apply" element={<Apply />} />
              <Route path="/apply/kyc" element={<ApplyKYC />} />
            </Route>
          </Route>

          {/* Backward-compatible redirect */}
          <Route path="/admin/*" element={<Navigate to="/operations" replace />} />

          {/* Operations Center routes */}
          <Route element={<OperationsRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/operations" element={<AdminOverview />} />
              <Route path="/operations/executive" element={<ExecutiveDashboard />} />
              <Route path="/operations/security-dashboard" element={<SecurityComplianceDashboard />} />
              <Route path="/operations/applications" element={<AdminApplications />} />
              <Route path="/operations/kyc" element={<AdminKYC />} />
              <Route path="/operations/members" element={<AdminMembers />} />
              <Route path="/operations/operational-profiles" element={<OperationalProfiles />} />
              <Route path="/operations/accounts" element={<AdminAccounts />} />
              <Route path="/operations/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/operations/withdrawal-limits" element={<WithdrawalLimits />} />
              <Route path="/operations/verification-requests" element={<VerificationRequests />} />
              <Route path="/operations/service-requests" element={<ServiceRequests />} />
              <Route path="/operations/member-messages" element={<MemberMessages />} />
              <Route path="/operations/referrals" element={<Referrals />} />
              <Route path="/operations/response-templates" element={<ResponseTemplates />} />
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
    </Suspense>
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