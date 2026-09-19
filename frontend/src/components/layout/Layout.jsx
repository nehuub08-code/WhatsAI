import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import WhatsAppSimulatorModal from '../simulator/WhatsAppSimulatorModal';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const { admin, loading } = useAuth();
  const location = useLocation();
  const isConversations = location.pathname.startsWith('/conversations');

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#090D16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading WhatsAI...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090D16] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Navbar />
        <main
          className={`flex-1 min-h-0 ${
            isConversations
              ? 'p-3 md:p-4 overflow-hidden flex flex-col'
              : 'p-6 md:p-8 overflow-y-auto'
          }`}
        >
          <Outlet />
        </main>
      </div>
      <WhatsAppSimulatorModal />
    </div>
  );
};

export default Layout;
