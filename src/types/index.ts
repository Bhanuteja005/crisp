export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Candidate {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string[];
  yearsOfExperience?: number;
  role?: string;
  createdAt: string;
  progress: 'not_started' | 'in_progress' | 'completed';
  score?: number; // final
  summary?: SummaryResponse; // AI generated
  questions: InterviewQuestion[]; // full history + scores
  currentQuestionIndex?: number;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string | null;
  resumeData?: ResumeData;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  difficulty: Difficulty;
  timerSeconds: number;
  answer?: string;
  answerSubmittedAt?: string;
  score?: number; // AI judge score for this answer (0-100)
  autoSubmitted?: boolean;
  feedback?: string;
  startedAt?: string;
}

export interface ResumeData {
  filename: string;
  text: string;
  parsedFields: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: string[];
    education?: string[];
    summary?: string;
    yearsOfExperience?: number;
    technologies?: string[];
    projects?: string[];
  };
}

export interface ChatMessage {
  id: string;
  type: 'system' | 'user' | 'question' | 'answer';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

export interface TimerState {
  isActive: boolean;
  timeLeft: number;
  totalTime: number;
  questionStartedAt?: string;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface QuestionGenerationRequest {
  difficulty: Difficulty;
  role: string;
  previousQuestions?: string[];
}

export interface ScoreResponse {
  score: number;
  feedback: string;
  reasoning?: string;
}

export interface SummaryResponse {
  summary: string;
  overallScore: number;
  strengths: string[];
  improvements: string[];
}