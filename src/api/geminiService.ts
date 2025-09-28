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

  async generateQuestion(request: QuestionGenerationRequest & { 
    candidateProfile?: {
      skills?: string[];
      experience?: string[];
      yearsOfExperience?: number;
      role?: string;
    }
  }): Promise<string> {
    const { candidateProfile } = request;
    const profileInfo = candidateProfile ? `

CANDIDATE PROFILE:
- Role: ${candidateProfile.role || request.role}
- Skills: ${candidateProfile.skills?.join(', ') || 'Not specified'}
- Years of Experience: ${candidateProfile.yearsOfExperience || 'Not specified'}
- Experience: ${candidateProfile.experience?.slice(0, 2).join('; ') || 'Not specified'}

INSTRUCTIONS:
- Tailor the question to their specific skills and experience level
- If they have React experience, ask React-specific questions
- If they're experienced (3+ years), make questions more advanced
- If they're junior (0-2 years), focus on fundamentals
- Use their actual skills to create relevant scenarios` : '';

    const timingGuide = {
      easy: '20 seconds - Basic concepts, definitions, or simple comparisons',
      medium: '60 seconds - Practical scenarios, problem-solving, or explanations with examples',  
      hard: '120 seconds - Complex system design, detailed analysis, or multi-part problems'
    };

    const prompt = `
Generate a single technical interview question for a ${request.role} position.

Difficulty: ${request.difficulty.toUpperCase()} (${timingGuide[request.difficulty]})
${profileInfo}

REQUIREMENTS:
- Make it engaging and directly relevant to their background
- Test practical knowledge and real-world application
- Avoid questions similar to: ${request.previousQuestions?.join(", ") || "none"}
- Return ONLY the question text, no additional formatting or explanations
- Ensure the question can be reasonably answered in the time limit

EXAMPLES BY DIFFICULTY:
Easy: "What's the difference between var, let, and const in JavaScript?"
Medium: "How would you handle state management in a React application with multiple components sharing data?"
Hard: "Design a scalable system architecture for a real-time chat application that supports 100,000+ concurrent users."
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      console.error("Error generating question:", error);
      return `🤖 [Offline Mode] ${this.getFallbackQuestion(request.difficulty, candidateProfile?.skills)}`;
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
      `Q: ${q.text}\nA: ${q.answer}\nScore: ${q.score || 0}/100\nFeedback: ${q.feedback || 'N/A'}`
    ).join('\n\n');

    const candidateProfile = `
CANDIDATE PROFILE:
- Name: ${candidate.name || 'Anonymous'}
- Role: ${candidate.role || 'Software Developer'}
- Skills: ${candidate.skills?.join(', ') || 'Not specified'}
- Years of Experience: ${candidate.yearsOfExperience || 'Not specified'}
- Resume Experience: ${candidate.experience?.slice(0, 2).join('; ') || 'Not specified'}
`;

    const prompt = `
Generate a comprehensive interview summary for this candidate:

${candidateProfile}

INTERVIEW PERFORMANCE:
${questionSummary}

STATISTICS:
- Questions Answered: ${answeredQuestions.length}/6
- Average Score: ${avgScore.toFixed(1)}/100
- Started: ${candidate.startedAt ? new Date(candidate.startedAt).toLocaleString() : 'N/A'}
- Status: ${candidate.progress}
- Interview Duration: ${candidate.startedAt && candidate.completedAt ? 
  Math.round((new Date(candidate.completedAt).getTime() - new Date(candidate.startedAt).getTime()) / 60000) + ' minutes' : 'N/A'}

INSTRUCTIONS:
- Consider their background and experience level when evaluating performance
- Provide specific, actionable feedback
- Be professional but encouraging
- Consider if questions matched their skill level appropriately

Respond in this exact JSON format:
{
  "summary": "[3-4 sentences summarizing overall performance, considering their background and experience level]",
  "overallScore": [number 0-100 - be fair but consider experience level],
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific improvement area 1", "specific improvement area 2", "specific improvement area 3"]
}
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

  private getFallbackQuestion(difficulty: Difficulty, skills?: string[]): string {
    // Skill-specific questions if we have skills info
    if (skills && skills.length > 0) {
      const hasReact = skills.some(s => s.toLowerCase().includes('react'));
      const hasNode = skills.some(s => s.toLowerCase().includes('node'));
      const hasPython = skills.some(s => s.toLowerCase().includes('python'));

      const skillBasedQuestions = {
        easy: [
          hasReact ? "What are React hooks and why were they introduced?" : "What is the difference between let, const, and var in JavaScript?",
          hasNode ? "What is the event loop in Node.js?" : "Explain what a REST API is.",
          hasPython ? "What's the difference between a list and a tuple in Python?" : "What is the purpose of CSS?"
        ],
        medium: [
          hasReact ? "How would you optimize a React component that re-renders frequently?" : "Describe how you would implement state management in a web application.",
          hasNode ? "How would you handle file uploads in a Node.js application?" : "Explain the difference between SQL and NoSQL databases.",
          hasPython ? "How would you implement a REST API using Flask or Django?" : "What are some common security vulnerabilities in web applications?"
        ],
        hard: [
          hasReact ? "Design a React application architecture for a large-scale e-commerce platform with complex state management needs." : "Design a system to handle real-time notifications for millions of users.",
          hasNode ? "How would you design a scalable Node.js microservices architecture for a social media platform?" : "Explain how you would implement authentication in a distributed system.",
          hasPython ? "Design a machine learning pipeline for real-time fraud detection using Python." : "Describe how you would optimize a slow-performing database query."
        ]
      };

      const questions = skillBasedQuestions[difficulty];
      return questions[Math.floor(Math.random() * questions.length)];
    }

    // Default fallback questions
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