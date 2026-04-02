import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle, XCircle, Copy, AlertTriangle,
  TrendingUp, Briefcase, ArrowRight, Plus, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useJobStore } from '../store/jobStore';
import { format, subDays } from 'date-fns';
const SKILL_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const normalizeList = (value: string[] | string | null | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

// Mock analytics for Demo (replaced by real DB data when connected)
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
  const { jobs, setJobs } = useJobStore();
  const navigate = useNavigate();
  const [data] = useState(generateMockData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      if (!user) return;
      const { data: jobData } = await supabase
        .from('job_roles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (jobData) setJobs(jobData);
      setLoading(false);
    };
    loadJobs();
  }, [user, setJobs]);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Recruiter';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Here's what's happening with your recruitment pipeline today.
          </p>
        </div>
        <button onClick={() => navigate('/jobs')} className="btn-primary">
          <Plus className="h-4 w-4" /> New Job Role
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats(data).map(({ label, value, icon: Icon, color, bg, change }) => (
          <div key={label} className={`stat-card border ${bg}`}>
            <div className="flex items-center justify-between mb-3">
              <Icon className={`h-5 w-5 ${color}`} />
              {change && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  {change}
                </span>
              )}
            </div>
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-white/40">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline chart */}
        <div className="glass-card-solid p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Applications Over Time</h2>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-400" />Applications</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Shortlisted</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} fill="url(#colorApps)" />
              <Area type="monotone" dataKey="shortlisted" stroke="#10b981" strokeWidth={2} fill="url(#colorShortlisted)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Skill distribution */}
        <div className="glass-card-solid p-5">
          <h2 className="section-title mb-4">Skill Distribution</h2>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie data={data.skills} cx={75} cy={75} innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                {data.skills.map((_, index) => (
                  <Cell key={index} fill={SKILL_COLORS[index % SKILL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
            </PieChart>
          </div>
          <div className="mt-3 space-y-2">
            {data.skills.map(({ name, value }, i) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: SKILL_COLORS[i % SKILL_COLORS.length] }} />
                  <span className="text-white/60">{name}</span>
                </div>
                <span className="font-semibold text-white/80">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="glass-card-solid p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Recent Job Roles</h2>
          <button onClick={() => navigate('/jobs')} className="btn-ghost text-xs">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl shimmer" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Briefcase className="h-10 w-10 text-white/15 mb-3" />
            <p className="text-sm text-white/40">No job roles yet.</p>
            <button onClick={() => navigate('/jobs')} className="mt-3 btn-primary text-xs">
              Create your first role
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate('/candidates')}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 p-4 cursor-pointer hover:border-brand-400/30 hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 border border-brand-500/25">
                    <Briefcase className="h-4 w-4 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{job.title}</p>
                    <p className="text-xs text-white/40">{job.experience_level} · {normalizeList(job.required_skills).slice(0, 3).join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Activity className="h-3 w-3" />
                    <span>{job.candidate_count || 0} candidates</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/20" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
