import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIMetadata } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Flagged keywords for academic integrity check
const FLAGGED_KEYWORDS = [
  'official exam',
  'final exam answer',
  'answer key',
  'copyrighted',
  'do not distribute',
  'confidential',
  'faculty only',
  'instructor copy',
];

export const checkAcademicIntegrity = (text: string): { flagged: boolean; reason?: string } => {
  const lowerText = text.toLowerCase();
  for (const keyword of FLAGGED_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return { flagged: true, reason: `Content contains flagged phrase: "${keyword}"` };
    }
  }
  return { flagged: false };
};

export const generateStudyKit = async (text: string): Promise<Partial<AIMetadata>> => {
  const prompt = `You are an academic study assistant. Given the following study notes, generate:
1. A concise summary (max 200 words)
2. 5 multiple-choice questions (MCQs) with 4 options each and indicate the correct answer index (0-based)
3. 5 relevant topic tags

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "summary": "...",
  "mcqs": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0 }
  ],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Notes content:
${text.substring(0, 8000)}`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const content = result.response.text();
  if (!content) return {};

  // Clean markdown code blocks if present
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as Partial<AIMetadata>;
};

export const extractBookInfo = async (text: string): Promise<Partial<AIMetadata>> => {
  const prompt = `Extract book/notes information from this OCR text. Respond ONLY with valid JSON, no markdown:
{
  "extractedTitle": "...",
  "isbn": "..." or null,
  "edition": "..." or null,
  "tags": ["subject1", "topic1", ...]
}

OCR Text:
${text.substring(0, 4000)}`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const content = result.response.text();
  if (!content) return {};

  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as Partial<AIMetadata>;
};

export const chatWithNotes = async (
  notesText: string,
  userQuestion: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> => {
  const context = `You are a study assistant for AcademicLink. You have access to a student's notes below. Answer questions ONLY based on the content of these notes. If the answer isn't in the notes, say so.

--- NOTES START ---
${notesText.substring(0, 12000)}
--- NOTES END ---

Previous conversation:
${chatHistory.slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n')}

Student's question: ${userQuestion}`;

  const model = getModel();
  const result = await model.generateContent(context);
  return result.response.text() || 'Sorry, I could not generate a response.';
};
