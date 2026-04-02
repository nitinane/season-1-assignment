# HireFlow AI 🚀

> AI-powered resume screening and comparative candidate ranking platform for modern HR teams.

![HireFlow AI Banner](https://img.shields.io/badge/HireFlow%20AI-HR%20Tech%20SaaS-6366f1?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Supabase%20%7C%20Groq-06b6d4?style=for-the-badge)

---

## What It Does

HireFlow AI automates the **entire initial recruitment workflow** — from receiving resumes through Gmail to AI-ranked candidate shortlisting and automated email outreach.

**Before HireFlow AI:** HR teams manually review 50–100 resumes, taking days.  
**After HireFlow AI:** Top 10 candidates shortlisted in minutes with high-fidelity comparative AI scoring.

---

## 🎯 How to Use

Follow these steps to screen candidates with HireFlow AI:

### 1. Account Setup
- **Login**: Click **"Sign in with Google"**. Ensure you grant the requested Gmail permissions (Read/Send) so the AI can access your recruitment mailbox.
- **Job Role**: Navigate to the **Jobs** tab and create a new position (e.g., "Senior Frontend Developer"). Define the required skills and experience levels.

### 2. Running the AI Pipeline
- Go to the **Candidates** tab.
- **Date Filtering**: Select the date range during which you received the applications in your Gmail account.
- **Bias-Free Toggle**: Optionally turn on **"Bias-Free AI Screening"** to anonymize resumes before they reach the AI.
- **Screening**: Click **"Fetch & Score Resumes"**.

### 3. Reviewing the Shortlist
- Once the pipeline completes (approx. 2-5 minutes depending on volume), the **Top 10 Comparative Ranking** will appear.
- **AI Verdict**: Expand each candidate card to see their **Unique Ranking Reason**, AI-generated **Summary**, and specific **Strengths/Weaknesses**.
- **Prep**: Click **"Interview Questions"** to get 5-10 tailored technical questions for that specific candidate.

### 4. Automated Outreach
- Click **"Send Next Round Email"** to immediately notify the candidate they've been shortlisted. The system uses a clean, plain-text encoding to ensure the message arrives perfectly.

---

## Comparative Ranking Architecture

Unlike traditional ATS systems that score resumes individually, HireFlow AI uses a **Bulk Comparative Ranking Architecture**:

1.  **Dossier Generation**: The system compiles all resumes in a single date range into a high-detail dossier.
2.  **Global Comparison**: The Groq AI (Llama 3.3 70B) analyzes the entire pool simultaneously, ranking candidates against each other rather than just against a static checklist.
3.  **Identity Discovery**: A robust regex-based extraction engine identifies real names (e.g., identifying patterns preceding 'Email:') ensuring 100% data realism even with poor resume formatting.
4.  **Silent Fallback**: A high-speed local smart-ranking algorithm acts as a safety net, ensuring the UI always displays results even if API limits are reached.

---

## Features

| Feature | Description |
|---|---|
| 🔐 Google OAuth | Supabase Auth with Gmail scopes (`gmail.readonly`, `gmail.send`) |
| 📧 Gmail Integration | Automated mail fetching + resume attachment extraction |
| 📄 Multiformat Parsing | PDF.js + mammoth.js support for PDF & DOCX |
| 🤖 Bulk AI Ranking | Groq Llama-3.3-70B comparative analysis for Top 10 |
| 🆔 Identity Discovery | Regex + first-line cleansing to extract real candidate names |
| ⚖️ Bias-Free Mode | Optional anonymization of names/gender/location |
| 📬 Clean Emailing | Automated shortlist notification with plain-text encoding safety |
| 🎯 Interview Prep | AI-generated technical & behavioral questions per candidate |

---

## Tech Stack & Dependencies

### Core Stack
- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v3 + Lucide React
- **Backend / DB**: Supabase (PostgreSQL + RLS)
- **AI Engine**: Groq SDK (Llama 3.3 70B Versatile)
- **State Management**: Zustand 5

### Key Dependencies
- `@supabase/supabase-js`: Database & Auth interaction
- `groq-sdk`: High-speed AI inference
- `pdfjs-dist`: High-performance PDF text extraction
- `mammoth`: DOCX to HTML/Text conversion
- `date-fns`: Date manipulation for Gmail queries
- `recharts`: Analytics and data visualization
- `react-hot-toast`: Real-time UI notifications

---

## Quick Start

### 1. Clone & Install

```bash
cd hireflow-ai
npm install
```

### 2. Configure Environment

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=gsk_your-groq-key
```

### 3. Set Up Supabase

1.  Initialize your database using the provided migrations in `supabase/migrations/`.
2.  Enable **Google OAuth** in the Supabase Auth dashboard.
3.  Ensure the `shortlisted_candidates` table includes columns for `candidate_name`, `candidate_email`, and `resume_text`.

### 4. Set Up Google OAuth + Gmail API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Gmail API**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID → Supabase Dashboard → Auth → Google Provider

### 5. Run Locally

```bash
npm run dev
```

---

## Project Structure

```
src/
├── components/      # UI Components (CandidateCard, ScoreRing, etc.)
├── lib/
│   ├── supabase.ts  # Database Client
│   ├── groq.ts      # Bulk AI Ranking Engine
│   └── parser.ts    # PDF/DOCX multi-format parser
├── services/
│   ├── gmailService.ts # Gmail API interaction
│   └── mailService.ts  # Shortlist email automation
├── pages/
│   ├── Candidates.tsx  # Main AI Screening Pipeline
│   └── Dashboard.tsx   # Analytics & Overview
├── store/           # Zustand Stores
└── types/           # TypeScript Definitions
```

---

## License

MIT © HireFlow AI 2025
