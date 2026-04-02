import type { GmailMessage } from '../types';
import { getSenderEmail } from './gmailService';

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

export interface CandidateDTO {
  senderName: string;
  senderEmail: string;
  attachmentFiles: Array<{ filename: string; blob: Blob; mimeType: string }>;
  resumeText: string;
  receivedDate: string;
}

/**
 * Maps raw Gmail message and processed resume data to a clean AI Ranking DTO.
 */
export const mapToCandidateDTO = (
  message: GmailMessage,
  attachments: Array<{ filename: string; blob: Blob; mimeType: string }>,
  resumeText: string
): CandidateDTO => {
  const fromHeader = message.payload?.headers.find((h) => h.name.toLowerCase() === 'from');
  const senderName = fromHeader ? fromHeader.value.split('<')[0].trim() : 'Unknown';
  const senderEmail = getSenderEmail(message);
  
  // Extract date
  const dateHeader = message.payload?.headers.find((h) => h.name.toLowerCase() === 'date');
  const receivedDate = dateHeader ? new Date(dateHeader.value).toISOString() : new Date().toISOString();

  return {
    senderName,
    senderEmail,
    attachmentFiles: attachments,
    resumeText,
    receivedDate
  };
};

/**
 * Placeholder for future AI Ranking logic (scoring, categorization, etc.)
 */
export const rankCandidate = async (dto: CandidateDTO) => {
  console.log("Ranking candidate data:", dto.senderEmail);
  // Future implementation: interact with Groq/LLM to provide scores
  return true;
};
