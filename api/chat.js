import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable missing on server.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const message = String(body.message || '').trim() || 'Hello';

    const ai = new GoogleGenAI({ apiKey });

    // Simplified payload to verify base connection
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
    });

    const replyText = response.text || '';

    return res.status(200).json({ reply: replyText, expression: 'happy' });
  } catch (error) {
    // Expose the raw error message directly in the response payload
    const errDetail = error?.message || JSON.stringify(error) || String(error);
    return res.status(200).json({ 
      reply: `DEBUG_ERROR: ${errDetail}`, 
      expression: 'sad' 
    });
  }
}
