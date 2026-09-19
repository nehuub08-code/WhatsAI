import React, { useState } from 'react';
import { User, Lock, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Database, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ProfilePage = () => {
  const { admin } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setMsg({ type: 'success', text: 'Password successfully updated' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Admin Profile & System Health</h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage administrator credentials, view security privileges, and inspect subsystem statuses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Admin Profile Card */}
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur-xl space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[2px] shadow-glow-primary mb-4">
              <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center text-white font-extrabold text-2xl uppercase">
                {admin?.username?.[0] || 'A'}
              </div>
            </div>
            <h3 className="text-base font-bold text-white">{admin?.username || 'Super Admin'}</h3>
            <p className="text-xs text-blue-400 font-medium mt-0.5">Primary SaaS Operator</p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Account Role:</span>
              <strong className="text-slate-200">System Admin</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Session Type:</span>
              <strong className="text-slate-200">JWT (24hr Bearer)</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Encryption:</span>
              <strong className="text-slate-200">PBKDF2-SHA256</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Password Change Form */}
        <div className="md:col-span-2 rounded-3xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Change Admin Password</h3>
              <p className="text-xs text-slate-400">Update your access password using secure hash generation</p>
            </div>
          </div>

          {msg.text && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold shadow-glow-primary transition-all"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Subsystem Health Monitor Cards */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Subsystems & API Health</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Database Engine</p>
                <p className="text-[10px] text-slate-400">PostgreSQL / SQLite WAL</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Operational
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">WhatsApp Webhook</p>
                <p className="text-[10px] text-slate-400">Meta Cloud v21.0</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Google Gemini API</p>
                <p className="text-[10px] text-slate-400">2.5 Flash Autonomous</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
