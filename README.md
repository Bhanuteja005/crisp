# Crisp Interview - AI-Powered Technical Assessment Platform

A React-based technical interview platform that automates the interview process using Google Gemini AI. The system provides dual interfaces for interviewees and interviewers with intelligent question generation, automated scoring, and comprehensive evaluation.

## Architecture

### Tech Stack
- Frontend: React 19 with TypeScript
- Build Tool: Vite
- State Management: Redux Toolkit with Redux Persist
- Routing: React Router DOM v7
- AI Integration: Google Gemini 2.0 Flash
- Styling: Tailwind CSS with Framer Motion
- Resume Processing: PDF.js and Mammoth.js

### Project Structure
```
src/
├── api/                    # External API integrations
│   └── geminiService.ts    # Google Gemini AI service
├── app/                    # Redux store configuration
│   ├── store.ts            # Store setup with persistence
│   └── uiSlice.ts         # UI state management
├── components/             # Reusable UI components
│   ├── global/            # App-wide components
│   ├── onboarding/        # Landing page components
│   └── ui/                # Base UI components
├── constants/             # Application constants
├── features/              # Feature-based modules
│   ├── interviewee/       # Candidate interview logic
│   └── interviewer/       # Interviewer dashboard logic
├── functions/             # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── utils/                 # Utility modules
    └── resumeParser.ts    # Resume parsing logic
```

## Core Features

### AI-Powered Intelligence
- Dynamic Question Generation: Uses Gemini 2.5 Pro to create relevant, contextual questions
- Intelligent Scoring: AI evaluates answers with detailed feedback and reasoning
- Smart Summaries: Generates comprehensive candidate assessments automatically
- Personalized Questions: Tailors questions based on candidate skills and experience

### Interview Management
- Dual Interface: Synchronized Interviewee and Interviewer views
- Real-time Timers: Question-specific time limits with visual indicators
- Resume Parsing: Automatic extraction of contact info, skills, and experience
- Progress Tracking: Complete interview state management

### Resume Processing
- PDF and DOCX Support: Extracts text from uploaded resume files
- Smart Field Detection: Automatically identifies name, email, phone, skills, and experience
- Missing Field Recovery: Prompts for missing information before interview start
- Experience Analysis: Calculates years of experience and identifies technical skills

## Data Flow

### Resume Upload Flow
1. User uploads PDF/DOCX file
2. File processed using PDF.js or Mammoth.js to extract text
3. ResumeParser analyzes text using regex patterns and heuristics
4. Extracted data populates candidate profile (name, email, phone, skills, experience)
5. Missing fields identified and user prompted to complete information
6. Profile data used to personalize interview questions

### Interview Flow
1. Candidate completes profile information
2. AI generates personalized questions based on skills and experience level
3. Questions presented with appropriate time limits (easy: 20s, medium: 60s, hard: 120s)
4. Answers submitted and scored by AI with detailed feedback
5. Progress tracked through 6 questions of varying difficulty
6. Final summary generated with strengths and improvement areas

### State Management
- Redux Toolkit manages application state
- Redux Persist maintains data across browser sessions
- Separate slices for interview state and UI state
- Real-time synchronization between interviewee and interviewer views

## AI Integration

### Question Generation
- Contextual questions based on candidate profile
- Difficulty progression: 2 easy, 2 medium, 2 hard
- Avoids repetition with previous question tracking
- Role-specific content (Frontend, Backend, Full Stack)

### Scoring System
- AI evaluates technical accuracy and communication clarity
- Provides constructive feedback with specific suggestions
- Considers candidate experience level in evaluation
- Fallback scoring system for offline scenarios

### Summary Generation
- Comprehensive performance analysis
- Identifies specific strengths and improvement areas
- Professional, constructive feedback format
- Export-ready format for hiring decisions

## Configuration

### Environment Variables
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Build and Development
```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Technical Implementation

### Resume Parser
- Multi-format support (PDF, DOCX)
- Advanced text extraction with fallback mechanisms
- Pattern-based field identification
- Skills matching against comprehensive technology database
- Experience calculation from employment dates

### Timer System
- Precise countdown with visual indicators
- Auto-submission on timeout
- Pause/resume functionality
- Question-specific time limits

### Data Persistence
- Redux Persist maintains interview state
- LocalStorage for candidate data
- Session recovery after browser refresh
- Cross-tab synchronization

## Performance Considerations
- Code splitting with manual chunks
- Lazy loading of heavy components
- Optimized asset loading
- Memory-efficient file processing

## Architecture

## ✨ Key Features

### Tech Stack

- Frontend: React 19 with TypeScript### 🤖 AI-Powered Intelligence

- Build Tool: Vite- **Dynamic Question Generation**: Uses Gemini 2.5 Pro to create relevant, contextual questions

- State Management: Redux Toolkit with Redux Persist- **Intelligent Scoring**: AI evaluates answers with detailed feedback and reasoning

- Routing: React Router DOM v7- **Smart Summaries**: Generates comprehensive candidate assessments automatically

- AI Integration: Google Gemini API

- Styling: Tailwind CSS with Framer Motion### 🎯 Interview Management

- Resume Processing: PDF.js and Mammoth.js- **Dual Interface**: Synchronized Interviewee and Interviewer views

- **Real-time Timers**: Question-specific time limits with visual indicators
---

# Core flows (pseudocode + implementation guidance)

## 1) Resume upload & field extraction

* Candidate uploads file in Interviewee tab.
* If PDF: use `pdf-parse` in browser (or send file to a small serverless function) to extract text.
* If DOCX: use `mammoth` to convert to text.
* Run regex patterns to extract **name, email, phone**:

  * Email: `/[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i`
  * Phone: try `\+?\d{7,15}` with formatting cleanup.
  * Name: fallback — parse first lines or ask candidate to confirm name in chat.
* Save parsed fields to store. If any missing, mark `missingFields` and let chat ask them.

**Pseudocode**

```ts
const parsed = parseResume(file);
const { name, email, phone } = extractFields(parsed.text);
if (!name || !email || !phone) {
  // show missing fields flow in chat
}
```

## 2) Missing fields flow

* Before interview start, chat bot asks for any missing fields in natural sentences:

  * "I couldn't find a phone number on your resume. Could you share it now?"
* Candidate replies; validate & store before allowing the first question.

## 3) Interview question generation (AI)

* For production: call LLM to generate questions for role "Full Stack (React/Node)" with prescribed difficulties and one-by-one basis. Or pre-generate the 6 questions up-front.
* Recommendation: generate a question template set:

  * 2 easy (20s), 2 medium (60s), 2 hard (120s).
* For offline/dev: seed the questions array with static examples.

**Prompt example for LLM**

```
Generate one coding/interview question for a Full Stack (React/Node) role.
Difficulty: HARD
Output JSON: { "id": "...", "text": "...", "difficulty": "hard" }
```

## 4) Timers & auto-submit

* `Timer` component accepts seconds.
* When question displays, start countdown. If time hits 0:

  * auto-submit current text (even if empty) with `autoSubmitted=true`, record timestamp, move to next question.
* If candidate submits early, stop timer and move on.

Edge cases:

* If user refreshes or closes mid-question, the timer remaining must be persisted to store (save `questionStartedAt` and calculate remaining on restore).

**Timer persistence approach**

* Save `questionStartedAt` (timestamp) into candidate state.
* Remaining = `timerSeconds - (now - questionStartedAt)`. If <=0 then auto-submit on restore.

## 5) Scoring + final summary

* After each answer, send answer + question prompt to AI with an evaluation prompt that returns numeric score (0–100) and short feedback.
* After 6th question, compute final numeric score (weighted average or simple average) and request a short 2–4 sentence candidate summary from AI.

**Evaluation prompt idea**

```
You are an expert interviewer. Given the question and the candidate's answer, score 0-100 on technical correctness, brevity reasons, and provide a 1-2 sentence feedback. Output JSON { "score": 78, "feedback": "..." }
```

## 6) Interviewer dashboard

* Display candidates list (sortable by final score, date, progress).
* Clicking candidate opens details: full Q&A, per-question score+feedback, overall summary.
* Search by name/email; sort by score/date.

---

# State management & persistence

* Use **Redux Toolkit** with slices `candidates` and `ui`.
* Persist store with **redux-persist** and localStorage or use **localForage** for larger blobs.
* Persisted keys: candidates, current session progress, AI caches.
* On app load:

  * If there’s an unfinished candidate (`progress === 'in_progress'` and `currentQuestionIndex < 6`), show **Welcome Back** modal with Resume/Start options.
  * If clicked Resume → restore timers & continue.
  * If Start New or Delete → clear session.

---

# UI/UX wireframe (textual)

**Top nav**: Logo | Tabs: Interviewee | Interviewer

**Interviewee tab**

* Left: Resume upload + preview & parsed fields.
* Center: Chat window with messages (system/question as bot, candidate responses).
* Bottom: input box, submit button, small timer badge; progress progress bar (1/6).
* Modal for missing fields before first question.

**Interviewer tab**

* Top: Search input + sort dropdown.
* Body: Table of candidates (Name, Email, Score, Progress, Date).
* Right / modal: Candidate detail with timeline of Q&A + per-question score & final summary.

---
