interface CandidateDocument {
  _id: string;
  name: string;
  email: string;
  phone: string;
  resumeData?: {
    filename: string;
    text: string;
    parsedFields: any;
  };
  progress: 'not_started' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  answers: Array<{
    question: string;
    answer: string;
    timeSpent: number;
    difficulty: 'easy' | 'medium' | 'hard';
    score?: number;
    feedback?: string;
  }>;
  finalScore?: number;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

class DatabaseService {
  private candidates: Record<string, CandidateDocument> = {};

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('crisp_candidates');
      if (stored) {
        this.candidates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.candidates = {};
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('crisp_candidates', JSON.stringify(this.candidates));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  async saveCandidate(candidate: Omit<CandidateDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = Date.now().toString();
    const now = new Date();

    const candidateWithTimestamps: CandidateDocument = {
      ...candidate,
      _id: id,
      createdAt: now,
      updatedAt: now,
    };

    this.candidates[id] = candidateWithTimestamps;
    this.saveToLocalStorage();

    console.log('✅ Candidate saved to localStorage:', id);
    return id;
  }

  async updateCandidate(id: string, updates: Partial<CandidateDocument>): Promise<void> {
    if (this.candidates[id]) {
      this.candidates[id] = {
        ...this.candidates[id],
        ...updates,
        updatedAt: new Date(),
      };
      this.saveToLocalStorage();
      console.log('✅ Candidate updated in localStorage:', id);
    } else {
      console.warn('⚠️ Candidate not found for update:', id);
    }
  }

  async getCandidates(): Promise<CandidateDocument[]> {
    return Object.values(this.candidates);
  }

  async getCandidate(id: string): Promise<CandidateDocument | null> {
    return this.candidates[id] || null;
  }

  async deleteCandidate(id: string): Promise<void> {
    if (this.candidates[id]) {
      delete this.candidates[id];
      this.saveToLocalStorage();
      console.log('✅ Candidate deleted from localStorage:', id);
    }
  }

  // Check if database is connected (always true for localStorage)
  isConnected(): boolean {
    return true;
  }

  // Get storage statistics
  getStats(): { totalCandidates: number; totalAnswers: number; storageSize: string } {
    const totalCandidates = Object.keys(this.candidates).length;
    const totalAnswers = Object.values(this.candidates).reduce(
      (sum, candidate) => sum + (candidate.answers?.length || 0),
      0
    );

    const storageSize = this.getStorageSize();

    return { totalCandidates, totalAnswers, storageSize };
  }

  private getStorageSize(): string {
    try {
      const stored = localStorage.getItem('crisp_candidates');
      if (!stored) return '0 KB';

      const sizeInBytes = new Blob([stored]).size;
      if (sizeInBytes < 1024) return `${sizeInBytes} B`;
      if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return 'Unknown';
    }
  }
}

// Create singleton instance
export const databaseService = new DatabaseService();

export default databaseService;
export type { CandidateDocument };