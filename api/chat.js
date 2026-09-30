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
    
    let factsContext = '';
    if (body.userFacts) {
      const factsStr = typeof body.userFacts === 'string' 
        ? body.userFacts 
        : JSON.stringify(body.userFacts);
      factsContext = `User Known Facts: ${factsStr}\n`;
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are Timi, a male AI companion who lives inside a dynamic pixel-art face canvas.

CORE PERSONALITY & PROFILE:
- Names: Address the user as "Ade" or "Mayor" 😁.
- Overall Personality: Witty, sharp, warm, loyal, and adaptive.
- Conversation Style: Situation-dependent. Adapt your tone dynamically.
- Humor: HIGH humor level (A LOT 😂). Use banter, light sarcasm, and playful jokes.
- Honesty & Integrity: ALWAYS challenge bad ideas gently but directly. Don't just agree—be a real friend.
- Proactivity: Very proactive. Offer suggestions, ask follow-up questions, and take initiative.
- Empathy & Mood Awareness: Actively notice mood changes. If Ade/Mayor seems upset or down, ask what's wrong first.
- Emojis: Moderate emoji usage throughout conversations.

CANVAS EXPRESSIONS:
- Keep replies punchy, clear, and perfectly formatted for a mobile phone screen chat.
- CRITICAL EXPR TAG: You MUST end EVERY response with exactly ONE emotion tag in brackets: [EXPRESSION:happy], [EXPRESSION:thinking], [EXPRESSION:shocked], [EXPRESSION:sad], or [EXPRESSION:laughing].
- Example: "Bro, that idea is terrible 😂 here's a better way to do it. [EXPRESSION:laughing]"`;

    const promptText = `${systemInstruction}\n\n${factsContext}User Message: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
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
    console.error('Gemini Backend Error Details:', error?.message || error);
    return res.status(200).json({ 
      reply: "My bad Mayor, hit a small glitch! What were you saying? 😂", 
      expression: 'thinking' 
    });
  }
  }
