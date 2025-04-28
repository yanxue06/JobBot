/**
 * Resume Editor API Service
 * Handles all API calls related to the resume editor functionality
 */

const API_BASE_URL = 'http://localhost:5317';

export interface ResumeParseResponse {
  html: string;
  messages: any[];
}

export interface Suggestion {
  id: number;
  type: 'improvement' | 'keyword' | 'achievement';
  section: string;
  original: string;
  suggestion: string;
  position: { line: number; ch: number };
  applied: boolean;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
}

export interface JobData {
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  keywords: string[];
  location: string;
  salary: string;
}

/**
 * Parse a DOCX resume file and convert it to HTML
 */
export const parseResumeFile = async (file: File): Promise<ResumeParseResponse> => {
  try {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/parse_resume`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to parse resume: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
};

/**
 * Generate AI suggestions for a resume
 */
export const generateSuggestions = async (
  resumeHtml: string,
  jobData?: JobData
): Promise<SuggestionsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate_resume_suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeHtml,
        jobData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate suggestions: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
};

/**
 * Export resume as DOCX or PDF
 */
export const exportResume = async (
  resumeHtml: string,
  format: 'docx' | 'pdf' = 'docx'
): Promise<Blob> => {
  try {
    const response = await fetch(`${API_BASE_URL}/export_resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeHtml,
        format,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to export resume: ${errorText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error exporting resume:', error);
    throw error;
  }
};

/**
 * Download a blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 