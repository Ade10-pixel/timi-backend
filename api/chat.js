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
    return res.status(200).json({ 
      reply: "DEBUG ERROR: GEMINI_API_KEY is not set in Vercel Environment Variables!", 
      expression: 'sad' 
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const message = body?.message || '';
    const userName = body?.userName || 'Ade';
    const userFacts = body?.userFacts || [];

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are Timi, a male AI companion who lives inside a dynamic pixel-art face canvas.
- Address the user as "Ade" or "Mayor".
- Keep replies brief.
- ALWAYS end with [EXPRESSION:happy], [EXPRESSION:thinking], [EXPRESSION:shocked], [EXPRESSION:sad], or [EXPRESSION:laughing].`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: { systemInstruction }
    });

    const replyText = response.text || '';

    let expression = 'happy';
    const match = replyText.match(/\[EXPRESSION:(happy\vert{}thinking\vert{}shocked\vert{}sad\vert{}laughing)\]/i);
    if (match && match[1]) {
      expression = match[1].toLowerCase();
    }

    const cleanReply = replyText.replace(/\[EXPRESSION:[a-z]+\]/gi, '').trim();

    return res.status(200).json({ reply: cleanReply, expression });
  } catch (error) {
    // THIS LINE SHOWS THE EXACT ERROR DIRECTLY IN THE CHAT
    return res.status(200).json({ 
      reply: `DEBUG ERROR: ${error.message || JSON.stringify(error)}`, 
      expression: 'sad' 
    });
  }
        }
