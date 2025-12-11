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

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import AcceptInvite from './pages/auth/AcceptInvite';

const RequireAuth = ({ children }) => {
  const { currentUser } = useAuth();
  // In a real app, we'd render a loading spinner while checking auth status
  // For now, if currentUser is null (and not loading), we redirect
  // But since we handle loading in AuthProvider, this is simplified
  return currentUser ? children : <Navigate to="/login" replace />;
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
            <Route path="/app" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/app/clients" element={<RequireAuth><ClientsDirectory /></RequireAuth>} />
            <Route path="/app/clients/:id" element={<RequireAuth><ClientDetail /></RequireAuth>} />
            <Route path="/app/projects" element={<RequireAuth><Projects /></RequireAuth>} />
            <Route path="/app/projects/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />
            <Route path="/app/tasks" element={<RequireAuth><Tasks /></RequireAuth>} />
            <Route path="/app/calendar" element={<RequireAuth><Calendar /></RequireAuth>} />
            <Route path="/app/files" element={<RequireAuth><Files /></RequireAuth>} />
            <Route path="/app/team" element={<RequireAuth><Team /></RequireAuth>} />
            <Route path="/app/team/:id" element={<RequireAuth><EmployeeProfile /></RequireAuth>} />
            <Route path="/app/finance" element={<RequireAuth><Finance /></RequireAuth>} />
            <Route path="/app/finance/invoices/new" element={<RequireAuth><CreateInvoice /></RequireAuth>} />
            <Route path="/app/finance/invoices/:id" element={<RequireAuth><InvoiceView /></RequireAuth>} />
            <Route path="/app/sales" element={<RequireAuth><Sales /></RequireAuth>} />

            {/* Automation Routes */}
            <Route path="/app/automation" element={<RequireAuth><AutomationDashboard /></RequireAuth>} />
            <Route path="/app/automation/create" element={<RequireAuth><AutomationBuilder /></RequireAuth>} />
            <Route path="/app/automation/:id" element={<RequireAuth><AutomationBuilder /></RequireAuth>} />
            <Route path="/app/automation/logs" element={<RequireAuth><AutomationLogs /></RequireAuth>} />

            {/* Analytics Routes */}
            <Route path="/app/analytics" element={<RequireAuth><AnalyticsHome /></RequireAuth>} />
            <Route path="/app/analytics/company" element={<RequireAuth><CompanyDashboard /></RequireAuth>} />
            <Route path="/app/analytics/team" element={<RequireAuth><TeamDashboard /></RequireAuth>} />
            <Route path="/app/analytics/projects" element={<RequireAuth><ProjectDashboard /></RequireAuth>} />
            <Route path="/app/analytics/sales" element={<RequireAuth><SalesAnalytics /></RequireAuth>} />
            <Route path="/app/analytics/finance" element={<RequireAuth><FinanceAnalytics /></RequireAuth>} />
            <Route path="/app/settings" element={<RequireAuth><Settings /></RequireAuth>} />

            {/* Standalone Pages */}
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
            <Route path="/portal" element={<ClientPortal />} />

            {/* Admin Routes */}
            <Route path="/app/admin/recovery" element={<RequireAuth><DataRecovery /></RequireAuth>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
