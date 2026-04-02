export interface HRUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  google_access_token?: string;
  created_at: string;
}

export interface JobRole {
  id: string;
  hr_user_id: string;
  title: string;
  required_skills: string[];
  preferred_tools: string[];
  experience_level: string;
  description: string;
  candidate_count?: number;
  shortlisted_count?: number;
  created_at: string;
}

export interface Candidate {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  projects: string[];
  years_experience: number;
  education: string;
  certifications: string[];
  companies: string[];
  tech_stack: string[];
  keywords: string[];
  raw_text: string;
  resume_url?: string;
  received_at: string;
  created_at: string;
}

export interface ShortlistedCandidate {
  id: string;
  candidate_id: string;
  job_id: string;
  name: string;
  email: string;
  score: number;
  rank: number;
  strengths: string[];
  weaknesses: string[];
  reason: string;
  localScore: number;
  match_percentage?: number;
  summary?: string;
  missing_skills?: string[];
  jdMatchScore?: number;
  industryFitScore?: number;
  projectRelevanceScore?: number;
  experienceDepthScore?: number;
  communicationScore?: number;
  industryFit?: string;
  recommendation?: string;
  interview_questions?: InterviewQuestion[];
  candidate?: Candidate;
  duplicate_flag?: DuplicateFlag;
  fraud_flag?: FraudFlag;
  email_status?: 'pending' | 'sent' | 'failed';
}

export interface DuplicateFlag {
  id: string;
  candidate_id: string;
  duplicate_of_id: string;
  reason: string;
  similarity_score?: number;
}

export interface FraudFlag {
  id: string;
  candidate_id: string;
  risk_level: 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface InterviewQuestion {
  skill: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SentEmail {
  id: string;
  candidate_id: string;
  hr_user_id: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  email_body: string;
}

export interface AnalyticsData {
  total_applications: number;
  shortlisted: number;
  rejected: number;
  duplicates: number;
  frauds: number;
  avg_score: number;
  skill_distribution: Record<string, number>;
  applications_over_time: { date: string; count: number }[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers: { name: string; value: string }[];
    parts?: GmailPart[];
    body?: { data: string; size: number };
  };
  internalDate: string;
}

export interface GmailPart {
  partId: string;
  mimeType: string;
  filename: string;
  body: {
    attachmentId?: string;
    data?: string;
    size: number;
  };
  parts?: GmailPart[];
}

export interface ParsedResume {
  rawText: string;
  candidateData: Partial<Candidate>;
}

export interface AIScoreResult {
  rank: number;
  name: string;
  email?: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  reason: string;
  match_percentage?: number;
  summary?: string;
  missing_skills?: string[];
  jdMatchScore?: number;
  industryFitScore?: number;
  projectRelevanceScore?: number;
  experienceDepthScore?: number;
  communicationScore?: number;
  industryFit?: string;
  recommendation?: string;
}

export interface FraudResult {
  risk_level: 'low' | 'medium' | 'high';
  reasons: string[];
}

export type ProcessingStep =
  | 'idle'
  | 'fetching_emails'
  | 'downloading_attachments'
  | 'parsing_resumes'
  | 'anonymizing'
  | 'ai_scoring'
  | 'detecting_duplicates'
  | 'detecting_fraud'
  | 'shortlisting'
  | 'complete'
  | 'error';

export interface ProcessingState {
  step: ProcessingStep;
  progress: number;
  total: number;
  current: number;
  message: string;
}
