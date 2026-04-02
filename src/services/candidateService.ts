import { supabase } from '../lib/supabase';
import { getCurrentUser } from './authService';
import type { Candidate } from '../types';
import JSZip from 'jszip';

export const candidateService = {
  /**
   * Uploads a resume file to Supabase Storage.
   */
  async uploadResume(file: File | Blob, filename: string): Promise<string> {
    const hr_user_id = await getCurrentUser();
    const filePath = `${hr_user_id}/${Date.now()}_${filename}`;
    
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(data.path);
      
    return publicUrl;
  },

  /**
   * Inserts a new candidate into the database.
   */
  async createCandidate(candidate: Omit<Candidate, 'id' | 'created_at'>) {
    const hr_user_id = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('candidates')
      .insert([{
        ...candidate,
        hr_user_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Candidate;
  },

  /**
   * Fetches candidates for the current HR user.
   */
  async getCandidates() {
    const hr_user_id = await getCurrentUser();
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('hr_user_id', hr_user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Candidate[];
  },

  /**
   * Processes a ZIP file and extracts individual resume files.
   */
  async processZipFile(file: File): Promise<File[]> {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const files: File[] = [];

    for (const [filename, fileData] of Object.entries(contents.files)) {
      if (!fileData.dir && (filename.endsWith('.pdf') || filename.endsWith('.docx') || filename.endsWith('.doc'))) {
        const content = await fileData.async('blob');
        files.push(new File([content], filename, { type: 'application/octet-stream' }));
      }
    }
    
    return files;
  }
};
