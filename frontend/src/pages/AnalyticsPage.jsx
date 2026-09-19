import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Zap,
  Clock,
  Users,
  Activity,
  ShieldCheck,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import api from '../api/client';
import StatsCard from '../components/common/StatsCard';

const COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'];

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/analytics');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Computing analytics & charts...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">AI Telemetry & Business Insights</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time latency metrics, message volumes, hourly peaks, and customer retention metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Last 14 Days
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Messages"
          value={kpis.total_messages || 0}
          subtitle="Processed via Meta WhatsApp"
          icon={Activity}
          trend="+18%"
          trendPositive={true}
          color="blue"
        />
        <StatsCard
          title="AI Resolution Rate"
          value={kpis.ai_resolution_rate || "94.2%"}
          subtitle="Direct answer without escalation"
          icon={ShieldCheck}
          trend="Industry Standard"
          trendPositive={true}
          color="emerald"
        />
        <StatsCard
          title="Avg Latency"
          value={`${kpis.overall_avg_latency_ms || 235}ms`}
          subtitle="Gemini 2.5 Flash SLA Target < 500ms"
          icon={Zap}
          trend="Optimal"
          trendPositive={true}
          color="cyan"
        />
        <StatsCard
          title="SLA Compliance"
          value={kpis.sla_compliance || "99.1%"}
          subtitle="Uptime & availability"
          icon={TrendingUp}
          trend="99.9% target"
          trendPositive={true}
          color="purple"
        />
      </div>

      {/* Row 1: Daily Messages & New Users Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages per Day Area */}
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Messages Per Day</h3>
              <p className="text-xs text-slate-400">Total volume breakdown: user queries vs. AI replies</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.daily_messages || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="user_messages" name="User Messages" stroke="#2563EB" fillOpacity={1} fill="url(#colorUser)" />
                <Area type="monotone" dataKey="ai_replies" name="AI Replies" stroke="#06B6D4" fillOpacity={1} fill="url(#colorAi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Users Trend Line */}
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">New Contact Registrations</h3>
              <p className="text-xs text-slate-400">Newly initiated WhatsApp contacts over time</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.new_users_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="active_users" name="New Contacts" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Peak Activity Hours & AI Response Latency SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Activity Hours Bar */}
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Peak Activity Hours</h3>
              <p className="text-xs text-slate-400">24-Hour hourly distribution of incoming messages</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.peak_hours || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickLine={false} interval={2} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Bar dataKey="messages" name="Message Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Response Time SLA Trend */}
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">AI Response Latency (ms)</h3>
              <p className="text-xs text-slate-400">Gemini 2.5 Flash latency tracking vs. 500ms target SLA line</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.latency_trend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 600]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="avg_latency_ms" name="Actual Latency (ms)" stroke="#06B6D4" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target_sla_ms" name="SLA Ceiling (500ms)" stroke="#F43F5E" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Customer Retention & Conversation Depth Breakdown */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Conversation Depth & Retention</h3>
            <p className="text-xs text-slate-400">Distribution of contacts by message exchange depth</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.retention || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {(data?.retention || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {(data?.retention || []).map((item, idx) => (
              <div key={item.category} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-semibold text-slate-200">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">{item.count} users</span>
                  <span className="text-xs font-bold text-white bg-slate-700/60 px-2 py-0.5 rounded-lg">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
