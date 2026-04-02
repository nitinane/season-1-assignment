import { supabase } from '../lib/supabase';
import { bulkScoreCandidates } from '../lib/groq';
import { getCurrentUser } from './authService';

export const industryBenchmarks: Record<string, string[]> = {
  "Frontend Developer": [
    "React", "TypeScript", "JavaScript", "REST API integration", 
    "Responsive design", "State management", "Performance optimization", 
    "Git", "Deployment", "UI/UX fundamentals", "CSS/SASS"
  ],
  "Backend Developer": [
    "Node.js", "Express", "Database design", "Authentication", 
    "API security", "SQL", "System design", "Redis", "Docker", "Unit testing"
  ],
  "Fullstack Developer": [
    "React", "Node.js", "TypeScript", "SQL/NoSQL databases", 
    "API architecture", "Cloud services (AWS/Vercel)", "Deployment", 
    "Auth patterns", "Problem solving"
  ],
  "AI / Machine Learning Engineer": [
    "Python", "PyTorch/TensorFlow", "LLMs", "Prompt engineering", 
    "Data preprocessing", "Vectordb (Pinecone/Milvus)", "RAG pipelines",
    "Model deployment", "Mathematics", "Cloud GPUs"
  ],
  "Data Analyst": [
    "SQL", "Python/R", "Data visualization", "Tableau/PowerBI",
    "Statistics", "Excel (Advanced)", "Business acumen",
    "Critical thinking", "Data cleaning"
  ],
  "DevOps Engineer": [
    "Docker", "Kubernetes", "CI/CD pipelines", "Terraform",
    "Cloud providers (AWS/GCP/Azure)", "Monitoring (Prometheus/Grafana)",
    "Linux administration", "Networking", "Security"
  ]
};

export const getBenchmarksForRole = (title: string): string[] => {
  const lower = title.toLowerCase();
  
  if (lower.includes('frontend')) return industryBenchmarks["Frontend Developer"];
  if (lower.includes('backend')) return industryBenchmarks["Backend Developer"];
  if (lower.includes('fullstack')) return industryBenchmarks["Fullstack Developer"];
  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('llm')) 
    return industryBenchmarks["AI / Machine Learning Engineer"];
  if (lower.includes('data')) return industryBenchmarks["Data Analyst"];
  if (lower.includes('devops') || lower.includes('infra')) return industryBenchmarks["DevOps Engineer"];
  
  // Default to a general technical benchmark if no keyword matches
  return [
    "Problem solving", "Technical communication", "System understanding",
    "Core tooling", "Version control", "Professional experience"
  ];
};

export const aiRankingService = {
  /**
   * Orchestrates the full AI ranking pipeline for a specific job role.
   * Compares all candidates in the database for this job.
   */
  async processRankingPipeline(jobId: string) {
    const hr_user_id = await getCurrentUser();
    
    // 1. Fetch Job Role Details
    const { data: job, error: jobErr } = await supabase
      .from('job_roles')
      .select('*')
      .eq('id', jobId)
      .eq('hr_user_id', hr_user_id)
      .single();
    
    if (jobErr || !job) throw new Error('Job role not found or access denied');

    // 2. Fetch all candidates for this HR user (or specifically for this job if tagged)
    // Note: Candidates aren't technically linked to jobs in the candidates table, 
    // but we rank them all against this specific job's JD.
    const { data: allCandidates, error: candErr } = await supabase
      .from('candidates')
      .select('*')
      .eq('hr_user_id', hr_user_id);
      
    if (candErr) throw candErr;
    if (!allCandidates || allCandidates.length === 0) return [];

    // 3. Transform for Groq Bulk Engine
    const formattedCandidates = allCandidates.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      summary: c.summary || c.raw_text?.slice(0, 500),
      rawText: c.raw_text || "",
    }));

    // 4. Trigger Bulk AI Ranking
    const aiResults = await bulkScoreCandidates(formattedCandidates, job);

    if (!aiResults || aiResults.length === 0) throw new Error('AI Ranking failed to produce results');

    // 5. Clear stale shortlist for this job
    await supabase
      .from('shortlisted_candidates')
      .delete()
      .eq('job_id', jobId)
      .eq('hr_user_id', hr_user_id);

    // 6. Save top 10 results
    const resultsToSave = aiResults.map(res => {
      const originalCandidate = allCandidates.find(c => c.name === res.name || c.email === res.email);
      return {
        hr_user_id,
        job_id: jobId,
        candidate_id: originalCandidate?.id,
        score: Math.round(res.score),
        rank: res.rank,
        candidate_name: res.name,
        candidate_email: res.email,
        reason: res.reason,
        strengths: res.strengths,
        weaknesses: res.weaknesses || [],
        resume_text: res.summary || originalCandidate?.raw_text?.slice(0, 1000)
      };
    });

    const { data: saved, error: saveErr } = await supabase
      .from('shortlisted_candidates')
      .insert(resultsToSave)
      .select();

    if (saveErr) throw saveErr;
    return saved;
  }
};
