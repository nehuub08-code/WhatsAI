import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Clock,
  Bot,
  Zap,
  Cpu,
  ArrowUpRight,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Activity,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../api/client';
import StatsCard from '../components/common/StatsCard';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'];

const DashboardPage = () => {
  const [dashData, setDashData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'traffic', 'telemetry', 'retention'
  const [timeRange, setTimeRange] = useState('14d'); // '7d', '14d', '30d'

  const { autoReplyEnabled, setSimulatorOpen } = useAuth();
  const navigate = useNavigate();

  const fetchAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/analytics')
      ]);
      setDashData(dashRes.data);
      setAnalyticsData(analyticsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard and analytics data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(() => fetchAllData(), 25000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-medium">Loading telemetry & analytics...</p>
        </div>
      </div>
    );
  }

  const kpi = dashData?.kpi || {};
  const analyticsKpis = analyticsData?.kpis || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Operations & Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">Gemini 2.5 Flash</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">WhatsApp AI Control Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time message traffic, AI response latency SLA, and user retention analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pill */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                timeRange === '7d' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('14d')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                timeRange === '14d' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                timeRange === '30d' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAllData(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Simulator Launch */}
          <button
            onClick={() => setSimulatorOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Test Simulator</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatsCard
          title="Total Users"
          value={kpi.total_users || 0}
          subtitle="Registered contacts"
          icon={Users}
          trend="+12%"
          trendPositive={true}
          color="blue"
        />
        <StatsCard
          title="Conversations"
          value={kpi.total_conversations || 0}
          subtitle="Active chat threads"
          icon={MessageSquare}
          trend="+8%"
          trendPositive={true}
          color="cyan"
        />
        <StatsCard
          title="Messages Today"
          value={kpi.messages_today || 0}
          subtitle="Processed since 00:00"
          icon={ArrowUpRight}
          trend="+24%"
          trendPositive={true}
          color="purple"
        />
        <StatsCard
          title="Avg Latency"
          value={`${kpi.avg_response_time_ms || 240}ms`}
          subtitle="Target SLA < 500ms"
          icon={Clock}
          trend="Super Fast"
          trendPositive={true}
          color="emerald"
        />
        <StatsCard
          title="AI Resolution"
          value={analyticsKpis.ai_resolution_rate || "94.2%"}
          subtitle="Without escalation"
          icon={ShieldCheck}
          trend="Optimal"
          trendPositive={true}
          color="emerald"
        />
        <StatsCard
          title="SLA Compliance"
          value={analyticsKpis.sla_compliance || "99.1%"}
          subtitle="Meta webhook uptime"
          icon={TrendingUp}
          trend="99.9% target"
          trendPositive={true}
          color="purple"
        />
      </div>

      {/* Section Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'all'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Insights
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'traffic'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Traffic & Contacts
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'telemetry'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI SLA & Peak Hours
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'retention'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            User Retention
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Auto-refresh: 25s</span>
        </div>
      </div>

      {/* Primary Traffic Section (Merged from Dashboard & Analytics) */}
      {(activeTab === 'all' || activeTab === 'traffic') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Messages Graph (Gradient Area) */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Daily WhatsApp Traffic</h3>
                <p className="text-xs text-slate-400">Incoming customer queries vs. automated AI replies</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  User Inbound
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  AI Outbound
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashData?.daily_messages || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="user_messages" name="User Messages" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" />
                  <Area type="monotone" dataKey="ai_replies" name="AI Replies" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#aiGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Contacts Trend (Bar Chart) */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-white tracking-tight">Active Contacts</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Distinct WhatsApp users engaging each day</p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashData?.active_users_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="active_users" name="Active Contacts" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>24h Active: <strong className="text-white">{kpi.active_users_24h || 0}</strong></span>
              <button
                onClick={() => navigate('/users')}
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <span>Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Telemetry & SLA Section (Merged from AnalyticsPage) */}
      {(activeTab === 'all' || activeTab === 'telemetry') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Response Latency SLA Trend */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">AI Latency SLA Tracking</h3>
                <p className="text-xs text-slate-400">Gemini 2.5 Flash latency (ms) vs. 500ms ceiling SLA</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Avg: {analyticsKpis.overall_avg_latency_ms || 235}ms
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.latency_trend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 600]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="avg_latency_ms" name="Actual Latency (ms)" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="target_sla_ms" name="SLA Ceiling (500ms)" stroke="#F43F5E" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Activity Hours (24H distribution) */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Peak Activity Hours</h3>
                <p className="text-xs text-slate-400">24-hour message volume distribution</p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                24H Window
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.peak_hours || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickLine={false} interval={2} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
                  />
                  <Bar dataKey="messages" name="Message Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* User Retention & Conversation Depth Breakdown */}
      {(activeTab === 'all' || activeTab === 'retention') && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Conversation Depth & Retention</h3>
              <p className="text-xs text-slate-400">Distribution of contacts by message exchange depth</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData?.retention || []}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {(analyticsData?.retention || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              {(analyticsData?.retention || []).map((item, idx) => (
                <div key={item.category} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-xs font-medium text-slate-200">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">{item.count} users</span>
                    <span className="text-xs font-bold text-white bg-slate-700/60 px-2 py-0.5 rounded-md">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Messages & Activity Stream */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Recent WhatsApp Stream</h3>
            <p className="text-xs text-slate-400">Live incoming and outgoing conversation events</p>
          </div>
          <button
            onClick={() => navigate('/conversations')}
            className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span>Open Conversations Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {(dashData?.recent_messages || []).slice(0, 5).map((msg) => (
            <div key={msg.id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === 'assistant'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}
                >
                  {msg.role === 'assistant' ? 'AI' : 'WA'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {msg.role === 'assistant' ? 'WhatsAI (Gemini 2.5)' : `WhatsApp Contact #${msg.user_id}`}
                    </span>
                    {msg.latency_ms > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                        {msg.latency_ms}ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5 max-w-xl">{msg.message}</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
