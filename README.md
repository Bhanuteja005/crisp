# Crisp Interview - AI-Powered Technical Assessment Platform# 🚀 Crisp Interview - AI-Powered Technical Assessment Platform



## Overview

## 📖 Overview

A React-based technical interview platform that automates the interview process using Google Gemini AI. The system provides dual interfaces for interviewees and interviewers with intelligent question generation, automated scoring, and comprehensive evaluation.

Crisp Interview is a cutting-edge AI-powered technical assessment platform that streamlines the interview process with intelligent automation. Built with React and powered by Google's Gemini AI, it provides real-time question generation, automated scoring, and comprehensive candidate evaluation.

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
