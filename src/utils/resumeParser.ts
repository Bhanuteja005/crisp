import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { ResumeData } from '../types';

// Set up PDF.js worker using the public assets folder
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js';

export class ResumeParser {
  static async parseFile(file: File): Promise<ResumeData> {
    try {
      let text = '';
      
      if (file.type === 'application/pdf') {
        text = await this.parsePDF(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        text = await this.parseDocx(file);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
      }

      const parsedFields = this.extractFields(text);
      
      return {
        filename: file.name,
        text,
        parsedFields
      };
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw new Error('Failed to parse resume. Please ensure the file is readable and try again.');
    }
  }

  private static async parsePDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log('Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
      
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim().length > 0)
          .map((item: any) => item.str.trim())
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n';
        }
      }

      console.log('PDF parsing completed. Extracted text length:', fullText.length);
      
      if (!fullText.trim()) {
        throw new Error('No text content found in PDF. The document might be image-based or password-protected.');
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF parsing error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
      throw new Error('Failed to parse PDF. Please ensure it contains selectable text and is not password-protected.');
    }
  }

  private static async parseDocx(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to parse DOCX file.');
    }
  }

  private static extractFields(text: string): {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: string[];
  } {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = cleanText.match(emailRegex);
    const email = emailMatches?.[0];

    // Extract phone
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,15}/g;
    const phoneMatches = cleanText.match(phoneRegex);
    const phone = phoneMatches?.[0]?.replace(/\D/g, '').replace(/^1/, '');

    // Extract name (heuristic approach)
    const name = this.extractName(cleanText);

    // Extract skills
    const skills = this.extractSkills(cleanText);

    // Extract experience
    const experience = this.extractExperience(cleanText);

    return {
      name,
      email,
      phone: phone ? this.formatPhone(phone) : undefined,
      skills,
      experience
    };
  }

  private static extractName(text: string): string | undefined {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // First, try pattern matching for explicit name fields
    const namePatterns = [
      /(?:name|full name):\s*(.+)/i,
      /^name\s*(.+)$/mi,
      /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/m
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanedName = this.cleanName(match[1]);
        if (cleanedName && cleanedName.length >= 4) {
          return cleanedName;
        }
      }
    }
    
    // Try to find name in first few lines
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i];
      
      // Skip very short lines or lines with common non-name content
      if (line.length < 4) continue;
      
      if (this.isLikelyName(line)) {
        return this.cleanName(line);
      }
    }

    return undefined;
  }

  private static isLikelyName(text: string): boolean {
    // Skip if contains common non-name words
    const skipWords = ['resume', 'cv', 'curriculum', 'vitae', 'profile', 'about', 'contact', 'email', 'phone', 'address', 'summary', 'objective', 'experience', 'education', 'skills', 'projects', 'work', 'employment'];
    const lowerText = text.toLowerCase();
    
    if (skipWords.some(word => lowerText.includes(word))) {
      return false;
    }

    // Skip lines with email or phone patterns
    if (/@/.test(text) || /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(text)) {
      return false;
    }

    // Check if it looks like a name (2-4 words)
    const words = text.trim().split(/\s+/).filter(word => word.length > 1);
    if (words.length < 2 || words.length > 4) {
      return false;
    }

    // More flexible name matching - allow mixed case and common name patterns
    return words.every(word => {
      // Allow names with various capitalizations (McDonald, O'Connor, etc.)
      return /^[A-Z][a-z']+$/.test(word) || /^[A-Z][a-z]*[A-Z][a-z]*$/.test(word);
    }) && words.every(word => word.length >= 2 && word.length <= 25);
  }

  private static cleanName(name: string): string {
    return name.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
  }

  private static extractSkills(text: string): string[] {
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
      'Git', 'REST API', 'GraphQL', 'Redux', 'Express', 'Spring', 'Django', 'Flask',
      'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala',
      'Machine Learning', 'AI', 'Data Science', 'DevOps', 'Agile', 'Scrum'
    ];

    const foundSkills = skillKeywords.filter(skill => 
      new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'i').test(text)
    );

    return foundSkills;
  }

  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private static extractExperience(text: string): string[] {
    const experiencePatterns = [
      /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi,
      /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|present|current)/gi
    ];

    const experiences: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      for (const pattern of experiencePatterns) {
        const matches = line.match(pattern);
        if (matches) {
          // Look for company/role context around the date
          const context = this.extractContextAroundMatch(lines, line);
          if (context) {
            experiences.push(context);
          }
        }
      }
    }

    return [...new Set(experiences)].slice(0, 5); // Remove duplicates and limit
  }

  private static extractContextAroundMatch(lines: string[], matchLine: string): string | null {
    const index = lines.indexOf(matchLine);
    if (index === -1) return null;

    // Get surrounding lines for context
    const contextLines = [];
    for (let i = Math.max(0, index - 1); i <= Math.min(lines.length - 1, index + 1); i++) {
      const line = lines[i].trim();
      if (line && line.length > 5) {
        contextLines.push(line);
      }
    }

    return contextLines.join(' | ').substring(0, 200);
  }

  private static formatPhone(phone: string): string {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  }
}

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)\.]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
};