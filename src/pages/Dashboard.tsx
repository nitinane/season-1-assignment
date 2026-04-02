import React, { useState } from 'react';
import { 
  Briefcase, Mail, Zap, CheckCircle2, Loader2, ArrowRight, 
  ShieldCheck, Award, Send, User
} from 'lucide-react';
import { jobRoleService } from '../services/jobRoleService';
import * as gmailService from '../services/gmailService';
import { aiRankingService } from '../services/aiRankingService';
import { candidateService } from '../services/candidateService';
import { shortlistService } from '../services/shortlistService';
import { sendShortlistEmail } from '../services/mailService';
import { parseResume } from '../lib/parser';
import { extractResumeData } from '../lib/groq';
import type { JobRole, ShortlistedCandidate } from '../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  // Workflow States
  const [step, setStep] = useState(1);
  const [activeJob, setActiveJob] = useState<JobRole | null>(null);
  
  // Step 1: Job Form States
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    required_skills: '',
    experience_range: '0-2 years',
    location: 'Remote'
  });
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // Step 2: Gmail States
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    end: new Date().toISOString().split('T')[0]
  });
  const [isFetchingResumes, setIsFetchingResumes] = useState(false);
  const [fetchStats, setFetchStats] = useState({
    scanned: 0,
    resumes: 0,
    duplicates: 0,
    final: 0
  });

  // Step 3: AI Ranking States
  const [isRanking, setIsRanking] = useState(false);
  const [shortlist, setShortlist] = useState<ShortlistedCandidate[]>([]);

  // Step 1: Create Job Role
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.description) {
      toast.error('Please fill in role title and description');
      return;
    }
    setIsCreatingJob(true);
    try {
      const newJob = await jobRoleService.createRole({
        title: jobForm.title,
        description: jobForm.description,
        required_skills: jobForm.required_skills ? jobForm.required_skills.split(',').map(s => s.trim()) : [],
        experience_range: jobForm.experience_range,
        location: jobForm.location,
        preferred_tools: [],
        status: 'active'
      });
      setActiveJob(newJob);
      setStep(2);
      toast.success('Job Role Created');
    } catch (err) {
      toast.error('Failed to create job');
    } finally {
      setIsCreatingJob(false);
    }
  };

  // Step 2: Gmail Resume Fetch
  const handleGmailFetch = async () => {
    if (!activeJob) return;
    setIsFetchingResumes(true);
    setFetchStats({ scanned: 0, resumes: 0, duplicates: 0, final: 0 });

    try {
      const startUnix = Math.floor(new Date(dateRange.start).getTime() / 1000);
      const endUnix = Math.floor(new Date(dateRange.end).getTime() / 1000);
      const query = gmailService.buildResumeQuery(startUnix, endUnix);
      
      console.log("Fetching emails with query:", query);
      const emails = await gmailService.fetchEmails(query);
      setFetchStats(prev => ({ ...prev, scanned: emails.length }));

      let resumeCount = 0;
      let duplicateCount = 0;
      let finalCount = 0;

      for (const email of emails) {
        const attachments = await gmailService.getResumeAttachments(email);
        if (attachments.length > 0) {
          resumeCount += attachments.length;
          setFetchStats(prev => ({ ...prev, resumes: resumeCount }));

          for (const att of attachments) {
            try {
              // Extract and Parse
              const rawText = await parseResume(att.blob, att.mimeType, att.filename);
              const aiData = await extractResumeData(rawText);
              
              // Upload to storage
              const resumeUrl = await candidateService.uploadResume(att.blob, att.filename);

              // Create Candidate
              const { isDuplicate } = await candidateService.createCandidate({
                name: aiData.name || att.filename.split('.')[0],
                email: gmailService.getSenderEmail(email) || aiData.email || 'unknown@example.com',
                phone: aiData.phone || '',
                score: aiData.score || 0,
                summary: aiData.summary || '',
                skills: aiData.skills || [],
                projects: aiData.projects || [],
                years_experience: String(aiData.years_experience || ''),
                raw_text: rawText,
                resume_url: resumeUrl,
                received_at: new Date().toISOString(),
                education: aiData.education || '',
                certifications: aiData.certifications || [],
                companies: aiData.companies || [],
                tech_stack: aiData.tech_stack || [],
                keywords: aiData.keywords || [],
              } as any);

              if (isDuplicate) duplicateCount++;
              else finalCount++;

              setFetchStats(prev => ({ ...prev, duplicates: duplicateCount, final: finalCount }));
            } catch (err) {
              console.error("Error processing email resume:", err);
            }
          }
        }
      }

      toast.success(`Fetched ${finalCount} new resumes!`);
      setStep(3);
      handleAIRanking(); // Automatically trigger ranking after fetch

    } catch (err: any) {
      toast.error(err.message || 'Gmail Sync failed');
    } finally {
      setIsFetchingResumes(false);
    }
  };

  // Step 3: AI Ranking
  const handleAIRanking = async () => {
    if (!activeJob) return;
    setIsRanking(true);
    setStep(3);
    try {
      await aiRankingService.processRankingPipeline(activeJob.id);
      const data = await shortlistService.getShortlist(activeJob.id);
      setShortlist(data);
      setStep(4);
      toast.success('AI Ranking Complete');
    } catch (err) {
      toast.error('AI Ranking failed');
    } finally {
      setIsRanking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-in fade-in duration-1000">
      {/* Workflow Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-400/10 border border-brand-400/20 text-brand-400 text-[10px] font-bold uppercase tracking-widest">
           <Zap className="h-3 w-3" /> Progressive ATS Pipeline
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter">Hiring Workflow</h1>
        <p className="text-white/40 font-medium max-w-xl mx-auto">
          Scale your hiring from JD creation to AI-ranked shortlists in one continuous, high-precision workflow.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* STEP 1: Job Creator */}
        <div className={`relative transition-all duration-700 ${step > 1 ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
           <div className={`workflow-card p-12 space-y-8 ${step === 1 ? 'border-brand-400/40 shadow-2xl shadow-brand-400/5' : ''}`}>
             <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold ${step > 1 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-brand-400 text-slate-950 text-xl'}`}>
                  {step > 1 ? <CheckCircle2 className="h-6 w-6" /> : '1'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Define Job Role</h2>
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">Step 1: The Intelligence Foundation</p>
                </div>
             </div>

             {step === 1 ? (
               <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in slide-in-from-bottom-4 duration-500">
                 <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Role Title</label>
                   <input 
                     type="text" 
                     placeholder="e.g. Senior Frontend Developer"
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-400 outline-none transition-all placeholder:text-white/10"
                     value={jobForm.title}
                     onChange={e => setJobForm({...jobForm, title: e.target.value})}
                   />
                 </div>
                 <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Job Description (JD)</label>
                   <textarea 
                     placeholder="Paste full JD here..."
                     rows={4}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:ring-2 focus:ring-brand-400 outline-none transition-all placeholder:text-white/10 resize-none"
                     value={jobForm.description}
                     onChange={e => setJobForm({...jobForm, description: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Required Skills</label>
                   <input 
                     type="text" 
                     placeholder="React, TypeScript, AWS..."
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-400 outline-none transition-all placeholder:text-white/10"
                     value={jobForm.required_skills}
                     onChange={e => setJobForm({...jobForm, required_skills: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Experience Range</label>
                   <select 
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-400 outline-none transition-all appearance-none cursor-pointer"
                     value={jobForm.experience_range}
                     onChange={e => setJobForm({...jobForm, experience_range: e.target.value})}
                   >
                      <option className="bg-slate-950">0-2 years</option>
                      <option className="bg-slate-950">3-5 years</option>
                      <option className="bg-slate-950">5-8 years</option>
                      <option className="bg-slate-950">10+ years</option>
                   </select>
                 </div>
                 <div className="md:col-span-2 pt-4">
                    <button 
                      type="submit" 
                      className="w-full btn-primary py-5 group"
                      disabled={isCreatingJob}
                    >
                      {isCreatingJob ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Define Target Profile <ArrowRight className="h-5 w-5" /></>}
                    </button>
                 </div>
               </form>
             ) : (
               <div className="bg-brand-400/5 border border-brand-400/10 rounded-3xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-brand-400/20 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-brand-400" />
                     </div>
                     <div>
                        <p className="text-white font-bold tracking-tight">{activeJob?.title}</p>
                        <p className="text-xs text-white/30">{activeJob?.location} • {activeJob?.experience_range}</p>
                     </div>
                  </div>
                  <button onClick={() => setStep(1)} className="text-[10px] font-bold text-brand-400 uppercase tracking-widest hover:text-brand-300">Edit Role</button>
               </div>
             )}
           </div>
        </div>

        {/* STEP 2: Gmail Fetch */}
        {step >= 2 && (
          <div className={`relative transition-all duration-700 ${step > 2 ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            <div className={`workflow-card p-12 space-y-8 animate-in slide-in-from-top-12 duration-1000 ${step === 2 ? 'border-brand-400/40 shadow-2xl shadow-brand-400/5' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold ${step > 2 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-brand-400 text-slate-950 text-xl'}`}>
                  {step > 2 ? <CheckCircle2 className="h-6 w-6" /> : '2'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Fetch resumes directly from HR Gmail inbox</h2>
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">Step 2: Automated Pipeline Integration</p>
                </div>
              </div>

              {step === 2 ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Start Date</label>
                        <input 
                          type="date" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-400 outline-none transition-all color-scheme-dark"
                          value={dateRange.start}
                          onChange={e => setDateRange({...dateRange, start: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">End Date</label>
                        <input 
                          type="date" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-brand-400 outline-none transition-all color-scheme-dark"
                          value={dateRange.end}
                          onChange={e => setDateRange({...dateRange, end: e.target.value})}
                        />
                     </div>
                  </div>

                  {isFetchingResumes ? (
                    <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 space-y-6">
                       <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white tracking-tight flex items-center gap-3">
                             <Loader2 className="h-4 w-4 animate-spin text-brand-400" /> Connecting to Google Mail...
                          </p>
                          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest animate-pulse">Live Sync Active</span>
                       </div>
                       
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                             <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">Emails Scanned</span>
                             <span className="text-2xl font-black text-white">{fetchStats.scanned}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                             <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">Resumes Found</span>
                             <span className="text-2xl font-black text-brand-400">{fetchStats.resumes}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                             <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">Duplicates</span>
                             <span className="text-2xl font-black text-orange-400">{fetchStats.duplicates}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1">
                             <span className="text-[10px] font-black text-emerald-400/40 uppercase tracking-tighter">Final Batch</span>
                             <span className="text-2xl font-black text-emerald-400">{fetchStats.final}</span>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <button 
                      onClick={handleGmailFetch}
                      className="w-full flex items-center justify-center gap-4 bg-slate-900 border border-white/10 hover:border-brand-400/40 rounded-[2rem] px-8 py-10 transition-all duration-300 group shadow-2xl shadow-black/50"
                    >
                       <div className="h-16 w-16 rounded-[1.5rem] bg-brand-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Mail className="h-8 w-8 text-brand-400" />
                       </div>
                       <div className="text-left flex-1">
                          <p className="text-xl font-bold text-white tracking-tight">Sync Incoming Resumes</p>
                          <p className="text-sm text-white/30">Connect and fetch all resume attachments within the selected range</p>
                       </div>
                       <ArrowRight className="h-6 w-6 text-white/10 group-hover:text-brand-400 transition-colors" />
                    </button>
                  ) }
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                     </div>
                     <div>
                        <p className="text-white font-bold tracking-tight">Pipeline Populated</p>
                        <p className="text-xs text-white/30">{fetchStats.final} High-Precision Resumes Extracted</p>
                     </div>
                  </div>
                  <button onClick={() => setStep(2)} className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:text-emerald-400">Restart Fetch</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: AI Processing */}
        {step >= 3 && step < 5 && (
          <div className="relative animate-in slide-in-from-top-12 duration-1000">
            <div className={`workflow-card p-12 text-center space-y-8 ${isRanking ? 'border-brand-400/40 shadow-2xl shadow-brand-400/10' : ''}`}>
               <div className="relative inline-block">
                 <div className="absolute inset-0 bg-brand-400/20 blur-3xl animate-pulse rounded-full" />
                 <div className="relative h-24 w-24 rounded-[2rem] bg-brand-400/10 flex items-center justify-center">
                   <Zap className={`h-12 w-12 text-brand-400 ${isRanking ? 'animate-pulse' : ''}`} />
                 </div>
               </div>
               
               <div className="space-y-2">
                 {isRanking ? (
                   <>
                     <h2 className="text-3xl font-black text-white tracking-tighter">AI Intelligence Engine Active</h2>
                     <p className="text-white/40 max-w-sm mx-auto font-medium">Comparing all fetched candidates against your Job Role criteria. Ranking Top 10 matches...</p>
                     <div className="pt-6 flex justify-center">
                        <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
                     </div>
                   </>
                 ) : step === 3 ? (
                   <>
                      <h2 className="text-3xl font-black text-white tracking-tighter">Ready for Intelligence Audit</h2>
                      <p className="text-white/40 max-w-sm mx-auto font-medium">The resumes are fetched. Now, let the AI rank and identify the Top 10 best-fit candidates.</p>
                      <button onClick={handleAIRanking} className="mt-8 btn-primary px-12 py-5 font-black uppercase tracking-widest text-sm translate-y-0 hover:-translate-y-1 transition-transform">
                         Begin AI Ranking Pipeline
                      </button>
                   </>
                 ) : null}
               </div>
            </div>
          </div>
        )}

        {/* STEP 4: Shortlist Cards */}
        {step === 4 && shortlist.length > 0 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-brand-400/20 flex items-center justify-center">
                    <Award className="h-6 w-6 text-brand-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">AI Top 10 Shortlist</h2>
              </div>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Final Discovery Results</span>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {shortlist.map((candidateEntry, index) => {
                const isTop3 = index < 3;
                return (
                  <div key={candidateEntry.id} className="relative group animate-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${index * 150}ms` }}>
                    <div className={`absolute -left-4 -top-4 z-20 h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                      index === 0 ? 'bg-amber-400 text-slate-950 rotate-[-8deg] shadow-amber-400/40' :
                      index === 1 ? 'bg-slate-300 text-slate-950 rotate-[-4deg] shadow-slate-300/30' :
                      index === 2 ? 'bg-orange-400 text-slate-950 rotate-[-2deg] shadow-orange-400/30' :
                      'bg-slate-800 text-white shadow-black/50'
                    }`}>
                      <span className="text-[8px] absolute top-2 left-3 opacity-40">RANK</span>
                      #{index + 1}
                    </div>

                    <div className={`relative overflow-hidden bg-slate-950 border rounded-[2.5rem] transition-all duration-500 ${
                      isTop3 ? 'border-brand-400/30 shadow-2xl shadow-brand-400/10' : 'border-white/10 hover:border-white/20'
                    }`}>
                      <div className="p-8 lg:p-12 flex flex-col lg:row gap-12 relative z-10">
                        
                        {/* LEFT COLUMN: Profile */}
                        <div className="lg:w-1/3 flex flex-col gap-6">
                           <div className="flex items-start gap-6">
                              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                                {candidateEntry.candidate_name?.charAt(0) || <User className="h-8 w-8 text-white/20" />}
                              </div>
                              <div className="space-y-1">
                                 <h3 className="text-2xl font-bold text-white tracking-tight">{candidateEntry.candidate_name}</h3>
                                 <div className="flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-brand-400 fill-brand-400" />
                                    <span className="text-md font-black text-brand-400 tracking-tight">{candidateEntry.score}/100</span>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-3 pt-4 border-t border-white/5">
                              <div className="flex items-center gap-3 text-xs font-medium text-white/40">
                                <Mail className="h-3.5 w-3.5 text-brand-400" />
                                {candidateEntry.candidate_email}
                              </div>
                              <div className="flex items-center gap-3 text-xs font-medium text-white/40">
                                <Send className="h-3.5 w-3.5 text-brand-400" />
                                <button 
                                  onClick={async () => {
                                    const ok = await sendShortlistEmail(candidateEntry.candidate_email || '', candidateEntry.candidate_name || 'Candidate', activeJob?.title || 'Position', 'HR Team', 'hiring@hireflow.ai');
                                    if (ok) toast.success(`Follow-up sent to ${candidateEntry.candidate_name}`);
                                  }}
                                  className="hover:text-brand-400 transition-colors"
                                >
                                  Send Shortlist Email
                                </button>
                              </div>
                           </div>
                        </div>

                        {/* RIGHT COLUMN: AI Intelligence */}
                        <div className="lg:w-2/3 space-y-6">
                           <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
                              <div className="absolute top-0 left-0 w-1 h-full bg-brand-400/40" />
                              <p className="text-sm text-white font-medium italic leading-relaxed">
                                "{candidateEntry.reason}"
                              </p>
                           </div>
                           
                           <div className="flex flex-wrap gap-2">
                              {(candidateEntry.strengths || []).slice(0, 3).map((s, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/10">
                                  {s}
                                </span>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
