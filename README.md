# AI Productivity Companion

An intelligent full-stack productivity web application powered by **Google Gemini 1.5 Flash**, **Next.js 15**, **MongoDB**, and **Google Calendar API**.

---

## Features


**Smart Task Management** - Create tasks with AI-powered priority & risk scoring 
**AI Prioritization** - Gemini analyzes deadlines, effort, and context to rank tasks 
**Risk Predictor** - 0–100 risk score with AI explanation and recommendations 
**Daily Scheduler** - AI generates optimized schedules around your calendar 
**One-Click AI Help** - Context-aware action buttons per task (Resume → ATS Score, Interview → Mock Questions, etc.) 
**Subtask Decomposition** - AI breaks complex tasks into actionable subtasks 
**Calendar Intelligence** - Syncs Google Calendar; detects free slots and suggests tasks for each gap 
**Goal Tracking** - Daily/weekly/monthly goals with milestone tracking 
**Habit Streaks** - Daily habit logging with streak tracking and 7-day history 
**Weekly AI Review** - Gemini-generated narrative review with patterns and recommendations 
**Voice Input** - Web Speech API — speak tasks naturally, AI parses intent 
**Behavior Profiling** - AI learns your work patterns over time for smarter suggestions 

---

## Architecture

```
Next.js 15 App Router (SSR + Client Components)
├── Server Actions (mutations)
├── API Routes (async AI operations)
├── Service Layer
│   ├── AI Services (Gemini 1.5 Flash)
│   ├── Calendar Service (Google Calendar API)
│   └── Task/Behavior Services
├── MongoDB (Mongoose)
└── Google Cloud Run (deployment)
```

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd ai-productivity-companion
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Fill in all variables in `.env.local`:

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `CRON_SECRET` | `openssl rand -base64 32` |

### 3. Google Cloud Console setup

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable: **Google Calendar API**, **Google+ API**
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-domain.com/api/auth/callback/google` (prod)

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Google Cloud Run)

### Prerequisites
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
- Docker installed
- GCP project with Cloud Run API enabled

### Deploy

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 3. Create Artifact Registry
gcloud artifacts repositories create ai-productivity \
  --repository-format=docker \
  --location=asia-south1

# 4. Build and push image
gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_PROJECT/ai-productivity/app

# 5. Deploy to Cloud Run
gcloud run deploy ai-productivity-companion \
  --image asia-south1-docker.pkg.dev/YOUR_PROJECT/ai-productivity/app \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --memory 1Gi \
  --set-env-vars "NEXTAUTH_URL=https://YOUR_CLOUD_RUN_URL" \
  --set-secrets "MONGODB_URI=mongodb-uri:latest,NEXTAUTH_SECRET=nextauth-secret:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,GEMINI_API_KEY=gemini-api-key:latest,CRON_SECRET=cron-secret:latest"
```

### Set up daily cron (Cloud Scheduler)

```bash
gcloud scheduler jobs create http daily-productivity-cron \
  --schedule="0 1 * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/api/cron/daily" \
  --http-method=POST \
  --headers="x-cron-secret=YOUR_CRON_SECRET" \
  --location=asia-south1
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Login page
│   ├── (dashboard)/        # Protected dashboard pages
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── dashboard/          # Dashboard widgets
│   ├── tasks/              # Task components + AI buttons
│   ├── voice/              # Voice input
│   └── shared/             # Sidebar, Header
├── services/               # Business logic
│   ├── ai/                 # All Gemini AI services
│   ├── calendar.service.ts
│   └── task.service.ts
├── models/                 # Mongoose schemas
├── prompts/                # Structured Gemini prompts
├── actions/                # Next.js Server Actions
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
└── utils/                  # Date, risk calculator, etc.
```

---

## AI Workflow

```
Task Created
    │
    ▼
1. Risk Score (pure math, instant)
    │
    ▼
2. Gemini explains risk + suggests mitigations
    │
    ▼
3. Gemini generates context-specific action buttons
    │
    ▼
4. User clicks One-Click AI Help → Gemini executes action
    │
    ▼
5. AI Reprioritize (manual or automatic) ranks all tasks
    │
    ▼
6. AI Schedule assigns tasks to free calendar slots
    │
    ▼
7. Smart Reminders generated for tasks due in 48h
    │
    ▼
8. Weekly Review → behavior profile updated
```

---

## Security

- All routes protected by NextAuth JWT session middleware
- Every DB query includes `userId` ownership check
- User input wrapped in JSON before Gemini prompts (injection prevention)
- API keys stored as Cloud Run secrets (never in bundle)
- Cron endpoints protected by `x-cron-secret` header
- Per-user rate limiting on `/api/ai/*` routes

---

## Tech Stack

Framework - Next.js 15 (App Router)
Language - TypeScript
Database - MongoDB + Mongoose
Auth - NextAuth v5
AI - Google Gemini 1.5 Flash
Calendar - Google Calendar API v3
Styling - Tailwind CSS
Deployment - Google Cloud Run
Container - Docker
