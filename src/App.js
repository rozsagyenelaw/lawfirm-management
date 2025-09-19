import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import GlobalSearch from './components/GlobalSearch';
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
import { DataProvider } from './context/DataContext';
import AllDocuments from './pages/AllDocuments';
import './styles/App.css';

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
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
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <GlobalSearch />
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
              <Route path="/court-calculator" element={<CourtCalculator />} />
              <Route path="/activity-log" element={<ActivityLogPage />} />
              <Route path="/all-documents" element={<AllDocuments />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;
