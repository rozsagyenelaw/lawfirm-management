import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import GlobalSearch from './components/GlobalSearch';
import CourtReminders from './components/CourtReminders';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyDigest from './pages/DailyDigest';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import CourtCalculator from './pages/CourtCalculator';
import Kanban from './pages/Kanban';
import ActivityLogPage from './pages/ActivityLogPage';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import FinancialAnalytics from './pages/FinancialAnalytics';
import AllDocuments from './pages/AllDocuments';
import DocumentGeneration from './pages/DocumentGeneration';
import FireLitigation from './pages/FireLitigation';
import ClientSigningPage from './pages/ClientSigningPage';
import './styles/App.css';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main App Layout Component (for authenticated users)
const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <GlobalSearch />
      <CourtReminders />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/daily-digest" element={<DailyDigest />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/analytics" element={<FinancialAnalytics />} />
          <Route path="/court-calculator" element={<CourtCalculator />} />
          <Route path="/activity-log" element={<ActivityLogPage />} />
          <Route path="/all-documents" element={<AllDocuments />} />
          <Route path="/document-generation" element={<DocumentGeneration />} />
          <Route path="/fire-litigation" element={<FireLitigation />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="app">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            <Routes>
              {/* PUBLIC ROUTES - No Authentication Required */}
              <Route path="/login" element={<Login />} />
              <Route path="/sign/:sessionId" element={<ClientSigningPage />} />
              
              {/* PROTECTED ROUTES - Authentication Required */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
