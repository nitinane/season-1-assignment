import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle, XCircle, Copy, AlertTriangle,
  TrendingUp, Briefcase, ArrowRight, Plus, Activity,
  Zap, Target, ShieldAlert, Mail, FolderOpen
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import { format, subDays } from 'date-fns';

const SKILL_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

// Mock analytics for Demo
function generateMockData() {
  return {
    total: 87,
    shortlisted: 24,
    rejected: 51,
    duplicates: 8,
    frauds: 4,
    avg_score: 73,
    skills: [
      { name: 'React', value: 45 },
      { name: 'Python', value: 28 },
      { name: 'TypeScript', value: 38 },
      { name: 'Node.js', value: 22 },
      { name: 'SQL', value: 31 },
      { name: 'AWS', value: 15 },
    ],
    timeline: Array.from({ length: 14 }, (_, i) => ({
      date: format(subDays(new Date(), 13 - i), 'MMM d'),
      applications: Math.floor(Math.random() * 12) + 2,
      shortlisted: Math.floor(Math.random() * 4),
    })),
  };
}

const stats = (data: ReturnType<typeof generateMockData>) => [
  { label: 'Total Applications', value: data.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', change: '+12%' },
  { label: 'Shortlisted', value: data.shortlisted, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', change: '+5' },
  { label: 'Rejected', value: data.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', change: '' },
  { label: 'Duplicates', value: data.duplicates, icon: Copy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', change: '' },
  { label: 'Fraud Flags', value: data.frauds, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', change: '' },
  { label: 'Avg AI Score', value: `${data.avg_score}/100`, icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20', change: '+3pts' },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [data] = useState(generateMockData);

  useEffect(() => {
    // Analytics and other data could be loaded here
  }, [user]);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Recruiter';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const atsActions = [
    { title: 'Upload Resume Folder', desc: 'Bulk import Folder, ZIP or PDFs', icon: FolderOpen, path: '/upload', color: 'text-brand-400', bg: 'bg-brand-400/10' },
    { title: 'AI Analysis', desc: 'Rank candidates against roles', icon: Zap, path: '/analysis', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { title: 'Top 10 Shortlist', desc: 'View AI-ranked top fits', icon: Target, path: '/shortlist', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Fraud Center', desc: 'Identify suspicious profiles', icon: ShieldAlert, path: '/fraud', color: 'text-red-400', bg: 'bg-red-400/10' },
    { title: 'Follow-Up Tracker', desc: 'Track candidate communication', icon: Mail, path: '/follow-up', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { title: 'Job Roles', desc: 'Manage your active hiring JD', icon: Briefcase, path: '/jobs', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-white/50 font-medium">
            Welcome to your **HireFlow AI** ATS Dashboard.
          </p>
        </div>
        <button onClick={() => navigate('/jobs')} className="btn-primary group">
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> New Job Role
        </button>
      </div>

      {/* ATS Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atsActions.map((action) => (
          <div 
            key={action.title}
            onClick={() => navigate(action.path)}
            className="group relative overflow-hidden bg-white/[0.02] border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-brand-400/50 hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-500">
              <action.icon className="h-32 w-32" />
            </div>
            
            <div className="flex flex-col gap-4 relative z-10">
              <div className={`h-12 w-12 rounded-2xl ${action.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{action.title}</h3>
                <p className="text-xs text-white/40 font-medium mt-1">{action.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Launch <ArrowRight className="h-3.3 w-3.3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats(data).map(({ label, value, icon: Icon, color, bg, change }) => (
          <div key={label} className={`stat-card border ${bg} hover:scale-[1.02] transition-transform duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <Icon className={`h-5 w-5 ${color}`} />
              {change && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {change}
                </span>
              )}
            </div>
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card-solid p-6 lg:col-span-2 border border-white/5 rounded-3xl bg-slate-900/40">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-400" />
              Pipeline Velocity
            </h2>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-400" />Applications</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Shortlisted</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.timeline}>
              <defs>
                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorShortlisted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#fff', fontSize: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={3} fill="url(#colorApps)" animationDuration={1500} />
              <Area type="monotone" dataKey="shortlisted" stroke="#10b981" strokeWidth={3} fill="url(#colorShortlisted)" animationDuration={1800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-solid p-6 border border-white/5 rounded-3xl bg-slate-900/40">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-brand-400" />
            Top Skills
          </h2>
          <div className="flex justify-center relative">
            <PieChart width={200} height={200}>
              <Pie data={data.skills} cx={100} cy={100} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" animationDuration={2000}>
                {data.skills.map((_, index) => (
                  <Cell key={index} fill={SKILL_COLORS[index % SKILL_COLORS.length]} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#fff', fontSize: 12 }}
              />
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Global</span>
               <span className="text-white text-2xl font-bold tracking-tighter">Impact</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {data.skills.slice(0, 4).map(({ name, value }, i) => (
              <div key={name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ background: SKILL_COLORS[i % SKILL_COLORS.length] }} />
                  <span className="text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">{name}</span>
                </div>
                <span className="text-xs font-bold text-white/70">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
