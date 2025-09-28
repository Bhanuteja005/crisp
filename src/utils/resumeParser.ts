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
    education?: string[];
    summary?: string;
    yearsOfExperience?: number;
    technologies?: string[];
    projects?: string[];
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

    // Extract skills and technologies
    const skills = this.extractSkills(cleanText);
    const technologies = this.extractTechnologies(cleanText);

    // Extract experience
    const experience = this.extractExperience(cleanText);
    
    // Extract education
    const education = this.extractEducation(cleanText);
    
    // Extract summary/objective
    const summary = this.extractSummary(cleanText);
    
    // Calculate years of experience
    const yearsOfExperience = this.calculateYearsOfExperience(cleanText);
    
    // Extract projects
    const projects = this.extractProjects(cleanText);

    return {
      name,
      email,
      phone: phone ? this.formatPhone(phone) : undefined,
      skills,
      technologies,
      experience,
      education,
      summary,
      yearsOfExperience,
      projects
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
    const skillSections = ['skills', 'technical skills', 'technologies', 'expertise', 'competencies'];
    const skillKeywords = [
      // Programming Languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 
      'Rust', 'Swift', 'Kotlin', 'Scala', 'C', 'Objective-C', 'Dart', 'R', 'Matlab',
      
      // Frontend Technologies
      'React', 'Vue', 'Angular', 'HTML', 'CSS', 'SCSS', 'SASS', 'Bootstrap', 'Tailwind',
      'jQuery', 'Next.js', 'Nuxt.js', 'Svelte', 'Ember', 'Webpack', 'Vite', 'Parcel',
      
      // Backend Technologies
      'Node.js', 'Express', 'Spring', 'Django', 'Flask', 'Ruby on Rails', 'ASP.NET',
      'Laravel', 'CodeIgniter', 'FastAPI', 'Koa', 'Hapi', 'Nest.js',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'Elasticsearch', 'Oracle',
      'SQL Server', 'Firebase', 'DynamoDB', 'Cassandra', 'CouchDB',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD',
      'Terraform', 'Ansible', 'Chef', 'Puppet', 'GitLab', 'GitHub Actions',
      
      // Other Technologies
      'REST API', 'GraphQL', 'Redux', 'Zustand', 'RxJS', 'Socket.io', 'WebRTC',
      'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'OpenCV',
      
      // Methodologies
      'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'DevOps', 'Microservices'
    ];

    // Look for skills in dedicated sections first
    const lines = text.split('\n');
    let skillsFromSection: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (skillSections.some(section => line.includes(section))) {
        // Extract skills from the next few lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const skillLine = lines[j].trim();
          if (skillLine.length < 5 || /^[A-Z][a-z]+\s*:/.test(skillLine)) break;
          
          skillKeywords.forEach(skill => {
            if (new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'i').test(skillLine)) {
              if (!skillsFromSection.includes(skill)) {
                skillsFromSection.push(skill);
              }
            }
          });
        }
        break;
      }
    }

    // If no dedicated section found, search entire text
    const foundSkills = skillsFromSection.length > 0 ? skillsFromSection : 
      skillKeywords.filter(skill => 
        new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'i').test(text)
      );

    return [...new Set(foundSkills)].slice(0, 15); // Remove duplicates and limit
  }

  private static extractTechnologies(text: string): string[] {
    const techPatterns = [
      /(?:technologies?|tools?|frameworks?|libraries|platforms?)[\s:]+([^.]*)/gi,
      /(?:worked with|experience with|proficient in)[\s:]+([^.]*)/gi,
    ];

    const technologies: string[] = [];
    techPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const techs = match.split(/[,;|&]/).map(t => t.trim().replace(/[^\w\s.-]/g, ''));
          technologies.push(...techs.filter(t => t.length > 2 && t.length < 30));
        });
      }
    });

    return [...new Set(technologies)].slice(0, 10);
  }

  private static extractEducation(text: string): string[] {
    const educationKeywords = [
      'Bachelor', 'Master', 'PhD', 'Doctorate', 'BS', 'MS', 'MBA', 'BEng', 'MEng',
      'Computer Science', 'Software Engineering', 'Information Technology', 'Engineering',
      'University', 'College', 'Institute', 'School'
    ];

    const educationLines: string[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (educationKeywords.some(keyword => 
        new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i').test(line)
      )) {
        educationLines.push(line);
        // Also include the next line if it seems related
        if (i + 1 < lines.length && lines[i + 1].trim().length > 0) {
          const nextLine = lines[i + 1].trim();
          if (!/^[A-Z][a-z]+\s*:/.test(nextLine)) {
            educationLines.push(nextLine);
          }
        }
      }
    }

    return [...new Set(educationLines)].slice(0, 5);
  }

  private static extractSummary(text: string): string | undefined {
    const summaryKeywords = ['summary', 'objective', 'profile', 'about', 'overview'];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (summaryKeywords.some(keyword => line.includes(keyword))) {
        // Extract the next few lines as summary
        const summaryLines: string[] = [];
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          const summaryLine = lines[j].trim();
          if (summaryLine.length < 10 || /^[A-Z][a-z]+\s*:/.test(summaryLine)) break;
          summaryLines.push(summaryLine);
        }
        
        const summary = summaryLines.join(' ').trim();
        return summary.length > 20 ? summary.substring(0, 300) : undefined;
      }
    }

    // Fallback: use first paragraph if it looks like a summary
    const firstParagraph = text.split('\n\n')[0];
    if (firstParagraph && firstParagraph.length > 50 && firstParagraph.length < 400) {
      return firstParagraph.trim();
    }

    return undefined;
  }

  private static calculateYearsOfExperience(text: string): number | undefined {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
      /experience[:\s]*(\d+)\+?\s*years?/gi,
      /(\d+)\+?\s*years?\s*in\s*(?:software|development|programming)/gi
    ];

    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        const years = parseInt(match[1]);
        if (years >= 0 && years <= 50) {
          return years;
        }
      }
    }

    // Try to calculate from employment dates
    const dateRanges = this.extractDateRanges(text);
    if (dateRanges.length > 0) {
      const totalYears = dateRanges.reduce((sum, range) => sum + range.duration, 0);
      return Math.round(totalYears * 10) / 10; // Round to 1 decimal
    }

    return undefined;
  }

  private static extractProjects(text: string): string[] {
    const projectKeywords = ['project', 'application', 'system', 'platform', 'website', 'app'];
    const projects: string[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('project') && line.length > 10 && line.length < 200) {
        projects.push(line);
      } else if (projectKeywords.some(keyword => 
        lowerLine.includes(keyword) && lowerLine.includes('develop')
      )) {
        projects.push(line);
      }
    }

    return [...new Set(projects)].slice(0, 5);
  }

  private static extractDateRanges(text: string): Array<{start: Date, end: Date, duration: number}> {
    const dateRanges: Array<{start: Date, end: Date, duration: number}> = [];
    const patterns = [
      /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi,
      /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|present|current)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const startStr = match[1];
        const endStr = match[2];
        
        const startDate = new Date(startStr.includes(' ') ? startStr : `Jan ${startStr}`);
        const endDate = endStr.toLowerCase().includes('present') || endStr.toLowerCase().includes('current') 
          ? new Date() 
          : new Date(endStr.includes(' ') ? endStr : `Dec ${endStr}`);
        
        if (startDate && endDate && startDate < endDate) {
          const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          dateRanges.push({ start: startDate, end: endDate, duration });
        }
      }
    });

    return dateRanges;
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