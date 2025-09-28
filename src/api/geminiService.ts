import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuestionGenerationRequest, ScoreResponse, SummaryResponse, Difficulty, Candidate } from '../types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY || "your-api-key-here",
);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Generic content generation method with error handling
  static async generateContent(prompt: string): Promise<string> {
    const instance = new GeminiService();
    try {
      const result = await instance.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async generateQuestion(request: QuestionGenerationRequest): Promise<string> {
    const prompt = `
Generate a single interview question for a ${request.role} position.

Difficulty: ${request.difficulty.toUpperCase()}

Requirements:
- Make it engaging and relevant to ${request.role}
- Should test practical knowledge and problem-solving
- Avoid questions similar to: ${request.previousQuestions?.join(", ") || "none"}
- Return ONLY the question text, no additional formatting

Difficulty specifications:
- easy: 20 seconds to answer. Should be basic conceptual questions.
- medium: 60 seconds to answer. Should require some explanation or problem-solving.
- hard: 120 seconds to answer. Should be complex, requiring detailed analysis or coding knowledge.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      console.error("Error generating question:", error);
      return `🤖 [Offline Mode] ${this.getFallbackQuestion(request.difficulty)}`;
    }
  }

  async scoreAnswer(question: string, answer: string, difficulty: Difficulty): Promise<ScoreResponse> {
    const prompt = `
You are an expert technical interviewer. Evaluate this candidate's answer:

Question: "${question}"
Answer: "${answer}"
Difficulty Level: ${difficulty}

Provide a fair and constructive evaluation. Consider:
- Technical accuracy and understanding
- Completeness of the answer
- Communication clarity
- Problem-solving approach
- Creativity and insight

Be encouraging but honest. If the answer is brief or incomplete, acknowledge effort while noting areas for improvement.

Respond in this exact JSON format:
{
  "score": [number 0-100],
  "feedback": "[2-3 sentences of constructive feedback]",
  "reasoning": "[brief explanation of scoring rationale]"
}
    `;

    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            score: Math.max(0, Math.min(100, parsed.score || 0)),
            feedback: parsed.feedback || 'Unable to provide feedback at this time.',
            reasoning: parsed.reasoning
          };
        }
        
        throw new Error('Invalid response format');
      } catch (error: any) {
        lastError = error;
        console.error(`Error scoring answer (attempt ${attempt + 1}):`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.warn('AI service unavailable, using offline mode for scoring', lastError);
    return this.getFallbackScore(answer);
  }

  async generateSummary(candidate: Candidate): Promise<SummaryResponse> {
    const answeredQuestions = candidate.questions.filter(q => q.answer);
    const avgScore = answeredQuestions.length > 0 
      ? answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length 
      : 0;

    const questionSummary = answeredQuestions.map(q => 
      `Q: ${q.text}\nA: ${q.answer}\nScore: ${q.score || 0}/100`
    ).join('\n\n');

    const prompt = `
Generate a comprehensive interview summary for candidate: ${candidate.name || 'Anonymous'}

Interview Performance:
${questionSummary}

Overall Statistics:
- Questions Answered: ${answeredQuestions.length}/6
- Average Score: ${avgScore.toFixed(1)}/100
- Started: ${candidate.startedAt ? new Date(candidate.startedAt).toLocaleString() : 'N/A'}
- Status: ${candidate.progress}

Provide a professional evaluation in this exact JSON format:
{
  "summary": "[3-4 sentences summarizing overall performance and key insights]",
  "overallScore": [number 0-100 based on performance],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["area1", "area2", "area3"]
}

Be professional, constructive, and fair in your assessment.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Interview completed successfully.',
          overallScore: Math.max(0, Math.min(100, parsed.overallScore || avgScore)),
          strengths: parsed.strengths || ['Completed the interview', 'Showed engagement'],
          improvements: parsed.improvements || ['Continue practicing', 'Expand technical knowledge']
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Error generating summary:', error);
      return this.getFallbackSummary(candidate);
    }
  }

  private getFallbackQuestion(difficulty: Difficulty): string {
    const fallbackQuestions = {
      easy: [
        "What is the difference between let, const, and var in JavaScript?",
        "Explain what React components are and why they're useful.",
        "What is the purpose of CSS and how does it work with HTML?"
      ],
      medium: [
        "Describe the concept of state management in React. When would you use useState vs useReducer?",
        "Explain the difference between SQL and NoSQL databases. When would you choose one over the other?",
        "What are some common security vulnerabilities in web applications and how would you prevent them?"
      ],
      hard: [
        "Design a system to handle real-time notifications for a social media platform with millions of users.",
        "Explain how you would optimize a React application that's experiencing performance issues.",
        "Describe how you would implement authentication and authorization in a microservices architecture."
      ]
    };

    const questions = fallbackQuestions[difficulty];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  private getFallbackScore(answer: string): ScoreResponse {
    if (!answer || answer.trim() === '') {
      return {
        score: 0,
        feedback: 'No answer was provided for this question.'
      };
    }

    const wordCount = answer.trim().split(/\s+/).length;
    const hasKeywords = answer.toLowerCase().includes('because') || 
                       answer.toLowerCase().includes('since') || 
                       answer.toLowerCase().includes('therefore') ||
                       answer.toLowerCase().includes('however') ||
                       answer.toLowerCase().includes('example');
    
    let score = 40; // Base score
    
    // Word count scoring
    if (wordCount >= 10) score += 10;
    if (wordCount >= 25) score += 15;
    if (wordCount >= 50) score += 15;
    if (wordCount >= 100) score += 10;
    
    // Quality indicators
    if (hasKeywords) score += 10; // Shows reasoning
    if (answer.includes('?')) score += 5; // Shows curiosity/clarification
    if (answer.split('.').length > 2) score += 5; // Multiple sentences
    
    // Penalize very short answers
    if (wordCount < 5) score = Math.max(score - 20, 10);
    
    const feedback = this.generateFeedback(wordCount, hasKeywords, score);
    
    return {
      score: Math.min(100, Math.max(0, score)),
      feedback
    };
  }

  private generateFeedback(wordCount: number, hasKeywords: boolean, score: number): string {
    let feedback = '';
    
    if (score >= 80) {
      feedback = 'Excellent response! You provided a comprehensive answer with good reasoning.';
    } else if (score >= 60) {
      feedback = 'Good response. You demonstrated understanding and provided relevant details.';
    } else if (score >= 40) {
      feedback = 'Fair response. Consider adding more detail and explanation to strengthen your answer.';
    } else {
      feedback = 'Your response could be improved. Try to provide more comprehensive explanations with examples.';
    }
    
    // Add specific suggestions
    if (wordCount < 15) {
      feedback += ' Consider expanding your answer with more details.';
    }
    if (!hasKeywords) {
      feedback += ' Try to explain your reasoning using words like "because" or "since".';
    }
    
    feedback += ' (Note: AI scoring is temporarily unavailable - this is an automated assessment.)';
    
    return feedback;
  }

  private getFallbackSummary(candidate: Candidate): SummaryResponse {
    const answeredQuestions = candidate.questions.filter(q => q.answer);
    const avgScore = answeredQuestions.length > 0 
      ? answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length 
      : 50;

    return {
      summary: `Candidate completed ${answeredQuestions.length} out of 6 questions with an average score of ${avgScore.toFixed(1)}. Shows engagement and effort in the interview process.`,
      overallScore: Math.round(avgScore),
      strengths: ['Completed the interview', 'Demonstrated engagement', 'Provided thoughtful responses'],
      improvements: ['Expand technical knowledge', 'Practice explaining concepts', 'Work on communication skills']
    };
  }
}

export const geminiService = new GeminiService();