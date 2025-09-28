import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Candidate, ResumeData, ChatMessage, TimerState } from '../../types';
import { geminiService } from '../../api/geminiService';

interface InterviewState {
  currentCandidate: Candidate | null;
  chatMessages: ChatMessage[];
  timerState: TimerState;
  isInterviewActive: boolean;
  missingFields: string[];
  isGeneratingQuestion: boolean;
  isSubmittingAnswer: boolean;
}

const initialState: InterviewState = {
  currentCandidate: null,
  chatMessages: [],
  timerState: {
    isActive: false,
    timeLeft: 0,
    totalTime: 0,
  },
  isInterviewActive: false,
  missingFields: [],
  isGeneratingQuestion: false,
  isSubmittingAnswer: false,
};

// Async thunks
export const generateNextQuestion = createAsyncThunk(
  'interview/generateNextQuestion',
  async (_, { getState }) => {
    const state = getState() as { interview: InterviewState };
    const candidate = state.interview.currentCandidate;
    
    if (!candidate) throw new Error('No active candidate');
    
    const questionIndex = candidate.currentQuestionIndex || 0;
    const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'] as const;
    const difficulty = difficulties[questionIndex];
    
    const previousQuestions = candidate.questions.map(q => q.text);
    
    const questionText = await geminiService.generateQuestion({
      difficulty,
      role: 'Full Stack Developer',
      previousQuestions,
    });

    const timerSeconds = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 60 : 120;

    return {
      id: `q_${Date.now()}`,
      text: questionText,
      difficulty,
      timerSeconds,
      startedAt: new Date().toISOString(),
    };
  }
);

export const submitAnswer = createAsyncThunk(
  'interview/submitAnswer',
  async (answer: string, { getState }) => {
    const state = getState() as { interview: InterviewState };
    const candidate = state.interview.currentCandidate;
    
    if (!candidate) throw new Error('No active candidate');
    
    const currentQuestionIndex = candidate.currentQuestionIndex || 0;
    const currentQuestion = candidate.questions[currentQuestionIndex];
    
    if (!currentQuestion) throw new Error('No current question');

    const scoreResponse = await geminiService.scoreAnswer(
      currentQuestion.text,
      answer,
      currentQuestion.difficulty
    );

    return {
      answer,
      score: scoreResponse.score,
      feedback: scoreResponse.feedback,
      answerSubmittedAt: new Date().toISOString(),
    };
  }
);

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startNewInterview: (state, action: PayloadAction<{ name?: string; email?: string; phone?: string }>) => {
      const { name, email, phone } = action.payload;
      
      // If we have a current candidate, preserve their existing data if the new data is empty
      const existingCandidate = state.currentCandidate;
      
      // Use passed values if provided, otherwise preserve existing values
      const finalName = name !== undefined ? name : (existingCandidate?.name || '');
      const finalEmail = email !== undefined ? email : (existingCandidate?.email || '');
      const finalPhone = phone !== undefined ? phone : (existingCandidate?.phone || '');
      
      state.currentCandidate = {
        id: existingCandidate?.id || `candidate_${Date.now()}`,
        name: finalName,
        email: finalEmail,
        phone: finalPhone,
        createdAt: existingCandidate?.createdAt || new Date().toISOString(),
        progress: 'not_started',
        questions: [],
        currentQuestionIndex: 0,
        resumeData: existingCandidate?.resumeData,
      };
      
      // Check for missing fields immediately
      const missing = [];
      if (!finalName || finalName.trim() === '') missing.push('name');
      if (!finalEmail || finalEmail.trim() === '') missing.push('email');
      if (!finalPhone || finalPhone.trim() === '') missing.push('phone');
      
      state.missingFields = missing;
      
      // Add appropriate welcome message based on missing fields
      if (missing.length > 0) {
        const missingText = missing.map(field => {
          switch(field) {
            case 'name': return 'your name';
            case 'email': return 'your email address';
            case 'phone': return 'your phone number';
            default: return field;
          }
        }).join(', ');
        
        state.chatMessages = [{
          id: `msg_${Date.now()}`,
          type: 'system',
          content: `Welcome to Crisp Interview! Before we begin, I need to collect some information from you. Please provide ${missingText} in the form above to proceed with the interview.`,
          timestamp: new Date().toISOString(),
        }];
      } else {
        state.chatMessages = [{
          id: `msg_${Date.now()}`,
          type: 'system',
          content: `Welcome ${name}! I'll be conducting your technical interview today. We'll go through 6 questions of varying difficulty. Click 'Begin Interview' when you're ready to start!`,
          timestamp: new Date().toISOString(),
        }];
      }
      
      state.isInterviewActive = false;
    },

    setResumeData: (state, action: PayloadAction<ResumeData>) => {
      if (state.currentCandidate) {
        state.currentCandidate.resumeData = action.payload;
        const { name, email, phone } = action.payload.parsedFields;
        
        // Update fields only if they're not already set or if resume data is better
        if (name && name.trim() && (!state.currentCandidate.name || state.currentCandidate.name.trim() === '')) {
          state.currentCandidate.name = name;
          state.missingFields = state.missingFields.filter(f => f !== 'name');
        }
        if (email && email.trim() && (!state.currentCandidate.email || state.currentCandidate.email.trim() === '')) {
          state.currentCandidate.email = email;
          state.missingFields = state.missingFields.filter(f => f !== 'email');
        }
        if (phone && phone.trim() && (!state.currentCandidate.phone || state.currentCandidate.phone.trim() === '')) {
          state.currentCandidate.phone = phone;
          state.missingFields = state.missingFields.filter(f => f !== 'phone');
        }

        // Only check for fields that are still missing
        const stillMissing = [];
        if (!state.currentCandidate.name || state.currentCandidate.name.trim() === '') stillMissing.push('name');
        if (!state.currentCandidate.email || state.currentCandidate.email.trim() === '') stillMissing.push('email');
        if (!state.currentCandidate.phone || state.currentCandidate.phone.trim() === '') stillMissing.push('phone');
        
        // Only update missing fields, don't override the array completely
        const previousMissingCount = state.missingFields.length;
        state.missingFields = stillMissing;
        
        // Add encouraging message if some fields were filled from resume
        const fieldsUpdated = [];
        if (name && name.trim() && (!state.currentCandidate.name || previousMissingCount > stillMissing.length)) fieldsUpdated.push('name');
        if (email && email.trim() && (!state.currentCandidate.email || previousMissingCount > stillMissing.length)) fieldsUpdated.push('email');
        if (phone && phone.trim() && (!state.currentCandidate.phone || previousMissingCount > stillMissing.length)) fieldsUpdated.push('phone');
        
        if (fieldsUpdated.length > 0) {
          const fieldNames = { name: 'name', email: 'email address', phone: 'phone number' };
          const updatedText = fieldsUpdated.map(f => fieldNames[f as keyof typeof fieldNames]).join(', ');
          
          state.chatMessages.push({
            id: `msg_${Date.now()}`,
            type: 'system',
            content: `Great! I found your ${updatedText} from your resume. ${stillMissing.length === 0 ? "All information is now complete! You can begin the interview." : `Still need: ${stillMissing.map(f => fieldNames[f as keyof typeof fieldNames]).join(', ')}.`}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    },

    updateCandidateField: (state, action: PayloadAction<{ field: 'name' | 'email' | 'phone'; value: string }>) => {
      if (state.currentCandidate) {
        const { field, value } = action.payload;
        state.currentCandidate[field] = value;
        
        // Remove from missing fields if value is provided
        if (value && value.trim() !== '') {
          state.missingFields = state.missingFields.filter(f => f !== field);
          
          // Add encouraging message when a field is completed
          const fieldNames = { name: 'name', email: 'email address', phone: 'phone number' };
          state.chatMessages.push({
            id: `msg_${Date.now()}`,
            type: 'system',
            content: `Great! I've got your ${fieldNames[field]}. ${state.missingFields.length === 0 ? "All information collected! You can now begin the interview." : `Still need: ${state.missingFields.map(f => fieldNames[f as keyof typeof fieldNames]).join(', ')}.`}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Add back to missing fields if value is empty
          if (!state.missingFields.includes(field)) {
            state.missingFields.push(field);
          }
        }
      }
    },

    addChatMessage: (state, action: PayloadAction<Omit<ChatMessage, 'id' | 'timestamp'>>) => {
      state.chatMessages.push({
        ...action.payload,
        id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
    },

    startInterview: (state) => {
      if (state.currentCandidate && state.missingFields.length === 0) {
        state.currentCandidate.progress = 'in_progress';
        state.currentCandidate.startedAt = new Date().toISOString();
        state.currentCandidate.currentQuestionIndex = 0;
        state.isInterviewActive = true;
      }
    },

    startTimer: (state, action: PayloadAction<{ seconds: number }>) => {
      state.timerState = {
        isActive: true,
        timeLeft: action.payload.seconds,
        totalTime: action.payload.seconds,
        questionStartedAt: new Date().toISOString(),
      };
    },

    tickTimer: (state) => {
      if (state.timerState.isActive && state.timerState.timeLeft > 0) {
        state.timerState.timeLeft -= 1;
      }
    },

    stopTimer: (state) => {
      state.timerState.isActive = false;
    },

    moveToNextQuestion: (state) => {
      if (state.currentCandidate) {
        const currentIndex = state.currentCandidate.currentQuestionIndex || 0;
        
        // Move to next question if there are more
        if (currentIndex < 5) { // 6 questions total (0-5)
          state.currentCandidate.currentQuestionIndex = currentIndex + 1;
        } else {
          // Interview completed - this is after the 6th question
          state.currentCandidate.progress = 'completed';
          state.currentCandidate.completedAt = new Date().toISOString();
          state.isInterviewActive = false;
          
          // Calculate final score
          const answeredQuestions = state.currentCandidate.questions.filter(q => q.score !== undefined);
          if (answeredQuestions.length > 0) {
            const avgScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length;
            state.currentCandidate.score = Math.round(avgScore);
          }
        }
      }
      state.timerState.isActive = false;
    },

    pauseInterview: (state) => {
      if (state.currentCandidate) {
        state.currentCandidate.pausedAt = new Date().toISOString();
      }
      state.timerState.isActive = false;
    },

    resumeInterview: (state) => {
      if (state.currentCandidate) {
        state.currentCandidate.pausedAt = null;
      }
    },

    clearCurrentInterview: (state) => {
      // Preserve resume data when clearing interview
      const preservedResumeData = state.currentCandidate?.resumeData;
      const preservedName = state.currentCandidate?.name;
      const preservedEmail = state.currentCandidate?.email;
      const preservedPhone = state.currentCandidate?.phone;
      
      return {
        ...initialState,
        currentCandidate: preservedName || preservedEmail || preservedPhone || preservedResumeData ? {
          ...initialState.currentCandidate!,
          name: preservedName || '',
          email: preservedEmail || '',
          phone: preservedPhone || '',
          resumeData: preservedResumeData,
        } : null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateNextQuestion.pending, (state) => {
        state.isGeneratingQuestion = true;
      })
      .addCase(generateNextQuestion.fulfilled, (state, action) => {
        state.isGeneratingQuestion = false;
        if (state.currentCandidate && state.currentCandidate.progress === 'in_progress') {
          state.currentCandidate.questions.push(action.payload);
          
          // Add question as chat message
          state.chatMessages.push({
            id: `msg_${Date.now()}`,
            type: 'question',
            content: action.payload.text,
            timestamp: new Date().toISOString(),
          });
        }
      })
      .addCase(generateNextQuestion.rejected, (state, action) => {
        state.isGeneratingQuestion = false;
        state.chatMessages.push({
          id: `msg_${Date.now()}`,
          type: 'system',
          content: `Sorry, there was an error generating the question: ${action.error.message}`,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(submitAnswer.pending, (state) => {
        state.isSubmittingAnswer = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isSubmittingAnswer = false;
        if (state.currentCandidate) {
          const currentQuestionIndex = state.currentCandidate.currentQuestionIndex || 0;
          const currentQuestion = state.currentCandidate.questions[currentQuestionIndex];
          
          if (currentQuestion) {
            currentQuestion.answer = action.payload.answer;
            currentQuestion.score = action.payload.score;
            currentQuestion.feedback = action.payload.feedback;
            currentQuestion.answerSubmittedAt = action.payload.answerSubmittedAt;
          }

          // Add answer as chat message
          state.chatMessages.push({
            id: `msg_${Date.now()}`,
            type: 'answer',
            content: action.payload.answer,
            timestamp: new Date().toISOString(),
          });
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isSubmittingAnswer = false;
        state.chatMessages.push({
          id: `msg_${Date.now()}`,
          type: 'system',
          content: `Error submitting answer: ${action.error.message}`,
          timestamp: new Date().toISOString(),
        });
      });
  },
});

export const {
  startNewInterview,
  setResumeData,
  updateCandidateField,
  addChatMessage,
  startInterview,
  startTimer,
  tickTimer,
  stopTimer,
  moveToNextQuestion,
  pauseInterview,
  resumeInterview,
  clearCurrentInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;