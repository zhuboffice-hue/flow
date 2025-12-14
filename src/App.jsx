import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/public/Home';
import Features from './pages/public/Features';
import Pricing from './pages/public/Pricing';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import FAQ from './pages/public/FAQ';
import Legal from './pages/public/Legal';

// App Pages
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Files from './pages/Files';
import Team from './pages/Team';
import Departments from './pages/Departments';
import EmployeeProfile from './pages/people/EmployeeProfile';
import ClientPortal from './pages/ClientPortal';
import ClientsDirectory from './pages/clients/ClientsDirectory';
import ClientDetail from './pages/clients/ClientDetail';
import Finance from './pages/Finance';
import CreateInvoice from './pages/finance/CreateInvoice';
import InvoiceView from './pages/finance/InvoiceView';
import Sales from './pages/Sales';
import AutomationDashboard from './pages/automation/AutomationDashboard';
import AutomationBuilder from './pages/automation/AutomationBuilder';
import AutomationLogs from './pages/automation/AutomationLogs';

import AnalyticsHome from './pages/analytics/AnalyticsHome';
import CompanyDashboard from './pages/analytics/CompanyDashboard';
import TeamDashboard from './pages/analytics/TeamDashboard';
import ProjectDashboard from './pages/analytics/ProjectDashboard';
import SalesAnalytics from './pages/analytics/SalesAnalytics';
import FinanceAnalytics from './pages/analytics/FinanceAnalytics';
// Settings Page
import Settings from './pages/settings/Settings';
import DataRecovery from './pages/admin/DataRecovery';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import AcceptInvite from './pages/auth/AcceptInvite';
import RequireModule from './components/auth/RequireModule';

const RequireAuth = ({ children }) => {
  const { currentUser } = useAuth();
  // In a real app, we'd render a loading spinner while checking auth status
  // For now, if currentUser is null (and not loading), we redirect
  // But since we handle loading in AuthProvider, this is simplified
  return currentUser ? children : <Navigate to="/login" replace />;
};

const DashboardRedirect = () => {
  const { currentUser } = useAuth();
  console.log("DashboardRedirect: Checking user role", currentUser?.role);
  if (currentUser?.role === 'SuperAdmin') {
    return <Navigate to="/app/super-admin" replace />;
  }
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/invite/:code" element={<AcceptInvite />} />
            </Route>

            {/* App Routes (Protected) */}
            <Route path="/app" element={<RequireAuth><DashboardRedirect /></RequireAuth>} />
            <Route path="/app/clients" element={<RequireAuth><RequireModule module="clients"><ClientsDirectory /></RequireModule></RequireAuth>} />
            <Route path="/app/clients/:id" element={<RequireAuth><RequireModule module="clients"><ClientDetail /></RequireModule></RequireAuth>} />
            <Route path="/app/projects" element={<RequireAuth><RequireModule module="projects"><Projects /></RequireModule></RequireAuth>} />
            <Route path="/app/projects/:id" element={<RequireAuth><RequireModule module="projects"><ProjectDetail /></RequireModule></RequireAuth>} />
            <Route path="/app/tasks" element={<RequireAuth><RequireModule module="tasks"><Tasks /></RequireModule></RequireAuth>} />
            <Route path="/app/calendar" element={<RequireAuth><Calendar /></RequireAuth>} />
            <Route path="/app/files" element={<RequireAuth><RequireModule module="files"><Files /></RequireModule></RequireAuth>} />
            <Route path="/app/team" element={<RequireAuth><RequireModule module="team"><Team /></RequireModule></RequireAuth>} />
            <Route path="/app/departments" element={<RequireAuth><RequireModule module="departments"><Departments /></RequireModule></RequireAuth>} />
            <Route path="/app/team/:id" element={<RequireAuth><RequireModule module="team"><EmployeeProfile /></RequireModule></RequireAuth>} />
            <Route path="/app/finance" element={<RequireAuth><RequireModule module="finance"><Finance /></RequireModule></RequireAuth>} />
            <Route path="/app/finance/invoices/new" element={<RequireAuth><RequireModule module="finance"><CreateInvoice /></RequireModule></RequireAuth>} />
            <Route path="/app/finance/invoices/:id" element={<RequireAuth><RequireModule module="finance"><InvoiceView /></RequireModule></RequireAuth>} />
            <Route path="/app/sales" element={<RequireAuth><RequireModule module="sales"><Sales /></RequireModule></RequireAuth>} />

            {/* Automation Routes */}
            <Route path="/app/automation" element={<RequireAuth><RequireModule module="automation"><AutomationDashboard /></RequireModule></RequireAuth>} />
            <Route path="/app/automation/create" element={<RequireAuth><RequireModule module="automation"><AutomationBuilder /></RequireModule></RequireAuth>} />
            <Route path="/app/automation/:id" element={<RequireAuth><RequireModule module="automation"><AutomationBuilder /></RequireModule></RequireAuth>} />
            <Route path="/app/automation/logs" element={<RequireAuth><RequireModule module="automation"><AutomationLogs /></RequireModule></RequireAuth>} />

            {/* Analytics Routes */}
            <Route path="/app/analytics" element={<RequireAuth><RequireModule module="analytics"><AnalyticsHome /></RequireModule></RequireAuth>} />
            <Route path="/app/analytics/company" element={<RequireAuth><RequireModule module="analytics"><CompanyDashboard /></RequireModule></RequireAuth>} />
            <Route path="/app/analytics/team" element={<RequireAuth><RequireModule module="analytics"><TeamDashboard /></RequireModule></RequireAuth>} />
            <Route path="/app/analytics/projects" element={<RequireAuth><RequireModule module="analytics"><ProjectDashboard /></RequireModule></RequireAuth>} />
            <Route path="/app/analytics/sales" element={<RequireAuth><RequireModule module="analytics"><SalesAnalytics /></RequireModule></RequireAuth>} />
            <Route path="/app/analytics/finance" element={<RequireAuth><RequireModule module="analytics"><FinanceAnalytics /></RequireModule></RequireAuth>} />
            <Route path="/app/settings" element={<RequireAuth><RequireModule module="settings"><Settings /></RequireModule></RequireAuth>} />

            {/* Standalone Pages */}
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
            <Route path="/portal" element={<ClientPortal />} />

            {/* Admin Routes */}
            <Route path="/app/admin/recovery" element={<RequireAuth><DataRecovery /></RequireAuth>} />
            <Route path="/app/super-admin" element={<RequireAuth><SuperAdminDashboard /></RequireAuth>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
