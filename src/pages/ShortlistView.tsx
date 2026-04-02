import React, { useState, useEffect } from 'react';
import { Award, Star, Mail, Phone, Calendar, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { jobRoleService } from '../services/jobRoleService';
import { shortlistService } from '../services/shortlistService';
import type { JobRole, ShortlistedCandidate } from '../types';
import toast from 'react-hot-toast';

export default function ShortlistView() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [shortlist, setShortlist] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    jobRoleService.getRoles().then(setRoles).catch(console.error);
  }, []);

  const fetchShortlist = async (roleId: string) => {
    setLoading(true);
    try {
      const data = await shortlistService.getShortlist(roleId);
      setShortlist(data);
    } catch (error) {
      toast.error('Failed to fetch shortlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedRole(id);
    if (id) fetchShortlist(id);
    else setShortlist([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Top 10 Shortlist</h1>
          <p className="text-white/60">The AI-selected top candidates for your job roles, ranked by compatibility.</p>
        </div>
        
        <select
          value={selectedRole}
          onChange={handleRoleChange}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-400 outline-none transition-all text-sm min-w-[200px]"
        >
          <option value="">Select Job Role...</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
        </div>
      ) : shortlist.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
            <Award className="h-10 w-10 text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">No shortlist yet</h3>
            <p className="text-white/40 max-w-sm">Use the "AI Analysis" tool to rank candidates and generate your first Top 10 shortlist.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {shortlist.map((candidate, index) => (
            <div key={candidate.id} className="relative group bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-brand-400/30 rounded-3xl p-8 transition-all duration-500">
              {/* Rank Badge */}
              <div className="absolute -left-3 top-8 h-10 w-10 rounded-xl bg-brand-400 text-slate-950 flex items-center justify-center font-bold shadow-xl shadow-brand-400/40 rotate-[-12deg] group-hover:rotate-0 transition-transform duration-300">
                #{index + 1}
              </div>

              <div className="flex flex-col lg:flex-row gap-8 pl-8">
                <div className="lg:w-1/3 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-400/5 flex items-center justify-center text-brand-400 text-2xl font-bold border border-brand-400/10 shrink-0">
                      {(candidate as any).candidates?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-white group-hover:text-brand-300 transition-colors">
                        {(candidate as any).candidates?.name || 'Unknown Candidate'}
                      </h3>
                      <div className="flex items-center gap-2 text-white/40 text-sm">
                        <Star className="h-4 w-4 text-brand-400 fill-brand-400" />
                        <span className="font-bold text-brand-400">{candidate.score}% Match Score</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Mail className="h-4 w-4" />
                      {(candidate as any).candidates?.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Phone className="h-4 w-4" />
                      {(candidate as any).candidates?.phone || 'No phone'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Calendar className="h-4 w-4" />
                      Shortlisted on {new Date(candidate.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {((candidate as any).candidates?.skills || []).slice(0, 8).map((skill: string, i: number) => (
                        <span key={i} className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-white/5 text-white/40 border border-white/5">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Top Strengths
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3 h-full">
                      {(candidate.strengths || []).map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      AI Analysis Summary
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 h-full">
                      <p className="text-sm text-white/60 leading-relaxed italic">
                        "{candidate.reason || "No detail provided by AI."}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
