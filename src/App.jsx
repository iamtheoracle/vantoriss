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

// Admin pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminApplications from './pages/admin/AdminApplications';
import AdminKYC from './pages/admin/AdminKYC';
import AdminMembers from './pages/admin/AdminMembers';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminAgent from './pages/admin/AdminAgent';

// Layouts
import MemberLayout from './components/vantoris/MemberLayout';
import AdminLayout from './components/vantoris/AdminLayout';

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
        </Route>

        {/* Non-layout member routes */}
        <Route path="/apply" element={<Apply />} />
        <Route path="/apply/kyc" element={<ApplyKYC />} />

        {/* Admin routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/kyc" element={<AdminKYC />} />
          <Route path="/admin/members" element={<AdminMembers />} />
          <Route path="/admin/accounts" element={<AdminAccounts />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/assistant" element={<AdminAgent />} />
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