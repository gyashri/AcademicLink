const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateImageCaption(imageUrl) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Fetch image as base64
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = response.headers.get('content-type') || 'image/jpeg';

  const result = await model.generateContent([
    {
      inlineData: { data: base64, mimeType },
    },
    {
      text: `You are a college marketplace assistant. Analyze this image and respond in valid JSON only:
{
  "title": "A professional, concise listing title for this item (max 10 words)",
  "caption": "A 1-2 sentence description of the item, its condition, and appeal to college students",
  "category": "One of: Electronics, Stationery, Notes, Books, Other"
}
Respond with JSON only, no markdown.`,
    },
  ]);

  const text = result.response.text().trim();
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

async function generatePdfSummary(pdfText) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    {
      text: `You are a college study-material reviewer. Analyze these notes and respond in valid JSON only:
{
  "title": "A clear title for these notes (max 10 words)",
  "fivePointSummary": [
    "Main Topic: <what the notes cover>",
    "Depth: <Beginner friendly / Intermediate / Advanced>",
    "Clarity: <rate handwriting/typing clarity out of 5, with brief note>",
    "Diagrams & Examples: <Yes/No, with details>",
    "Estimated Revision Time: <e.g., 30 minutes, 1 hour>"
  ],
  "category": "Notes"
}

Here is the extracted text from the PDF:
---
${pdfText.substring(0, 8000)}
---

Respond with JSON only, no markdown.`,
    },
  ]);

  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { generateImageCaption, generatePdfSummary };
