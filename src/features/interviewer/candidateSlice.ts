import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Candidate } from '../../types';
import { geminiService } from '../../api/geminiService';

interface CandidateState {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  searchQuery: string;
  sortBy: 'date' | 'score' | 'name' | 'progress';
  sortOrder: 'asc' | 'desc';
  isGeneratingSummary: boolean;
}

const initialState: CandidateState = {
  candidates: [],
  selectedCandidate: null,
  searchQuery: '',
  sortBy: 'date',
  sortOrder: 'desc',
  isGeneratingSummary: false,
};

// Async thunks
export const generateCandidateSummary = createAsyncThunk(
  'candidates/generateSummary',
  async (candidateId: string, { getState }) => {
    const state = getState() as { candidates: CandidateState };
    const candidate = state.candidates.candidates.find(c => c.id === candidateId);
    
    if (!candidate) throw new Error('Candidate not found');
    
    const summary = await geminiService.generateSummary(candidate);
    return { candidateId, summary };
  }
);

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      const existingIndex = state.candidates.findIndex(c => c.id === action.payload.id);
      if (existingIndex >= 0) {
        state.candidates[existingIndex] = action.payload;
      } else {
        state.candidates.push(action.payload);
      }
    },

    updateCandidate: (state, action: PayloadAction<Candidate>) => {
      const index = state.candidates.findIndex(c => c.id === action.payload.id);
      if (index >= 0) {
        state.candidates[index] = action.payload;
      }
    },

    fixCandidateProgress: (state) => {
      // Fix candidates that should be completed but are still showing as in_progress
      state.candidates.forEach(candidate => {
        if (candidate.progress === 'in_progress' && 
            candidate.questions.length === 6 &&
            (candidate.currentQuestionIndex || 0) >= 5) {
          candidate.progress = 'completed';
          candidate.completedAt = candidate.completedAt || new Date().toISOString();
          if (!candidate.score && candidate.questions.length > 0) {
            const avgScore = candidate.questions.reduce((sum, q) => sum + (q.score || 0), 0) / candidate.questions.length;
            candidate.score = Math.round(avgScore);
          }
        }
      });
    },

    deleteCandidate: (state, action: PayloadAction<string>) => {
      state.candidates = state.candidates.filter(c => c.id !== action.payload);
      if (state.selectedCandidate?.id === action.payload) {
        state.selectedCandidate = null;
      }
    },

    selectCandidate: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        state.selectedCandidate = state.candidates.find(c => c.id === action.payload) || null;
      } else {
        state.selectedCandidate = null;
      }
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSortBy: (state, action: PayloadAction<'date' | 'score' | 'name' | 'progress'>) => {
      if (state.sortBy === action.payload) {
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = action.payload;
        state.sortOrder = 'desc';
      }
    },

    clearAllCandidates: (state) => {
      state.candidates = [];
      state.selectedCandidate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateCandidateSummary.pending, (state) => {
        state.isGeneratingSummary = true;
      })
      .addCase(generateCandidateSummary.fulfilled, (state, action) => {
        state.isGeneratingSummary = false;
        const { candidateId, summary } = action.payload;
        const candidate = state.candidates.find(c => c.id === candidateId);
        
        if (candidate) {
          candidate.summary = summary;
          candidate.score = summary.overallScore;
          
          // Update selected candidate if it's the same one
          if (state.selectedCandidate?.id === candidateId) {
            state.selectedCandidate = { ...candidate };
          }
        }
      })
      .addCase(generateCandidateSummary.rejected, (state, action) => {
        state.isGeneratingSummary = false;
        console.error('Failed to generate summary:', action.error.message);
      });
  },
});

export const {
  addCandidate,
  updateCandidate,
  deleteCandidate,
  selectCandidate,
  setSearchQuery,
  setSortBy,
  clearAllCandidates,
  fixCandidateProgress,
} = candidateSlice.actions;

// Memoized selectors
const selectCandidatesState = (state: { candidates: CandidateState }) => state.candidates;

export const selectFilteredAndSortedCandidates = createSelector(
  [selectCandidatesState],
  (candidatesState) => {
    const { candidates, searchQuery, sortBy, sortOrder } = candidatesState;
    
    // Filter by search query
    let filtered = candidates;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = candidates.filter(candidate => 
        candidate.name?.toLowerCase().includes(query) ||
        candidate.email?.toLowerCase().includes(query) ||
        candidate.phone?.includes(query)
      );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'score':
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'progress':
          const progressOrder = { 'not_started': 0, 'in_progress': 1, 'completed': 2 };
          aValue = progressOrder[a.progress];
          bValue = progressOrder[b.progress];
          break;
      }
      
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    return sorted;
  }
);

export default candidateSlice.reducer;