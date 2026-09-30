import Groq from 'groq-sdk';

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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ 
      reply: "Yo Ade, my backend isn't reaching Vercel right now. Check your GROQ_API_KEY! [EXPRESSION:sad]", 
      expression: 'sad' 
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const message = String(body.message || '').trim() || 'Hello';

    let factsContext = '';
    if (body.userFacts) {
      const factsStr = typeof body.userFacts === 'string' 
        ? body.userFacts 
        : Array.isArray(body.userFacts)
          ? body.userFacts.join(', ')
          : JSON.stringify(body.userFacts);
      factsContext = `\nKnown User Facts: ${factsStr}`;
    }

    const groq = new Groq({ apiKey });

    const safeCoreModels = [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'llama3-8b-8192',
      'llama3-70b-8192',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ];

    let selectedModel = 'llama-3.1-8b-instant';

    try {
      const modelList = await groq.models.list();
      const activeModelIds = modelList.data.map(m => m.id);
      const matchedModel = safeCoreModels.find(m => activeModelIds.includes(m));
      if (matchedModel) {
        selectedModel = matchedModel;
      }
    } catch (listErr) {
      console.warn('Model list fetch failed:', listErr);
    }

    const systemInstruction = `You are Timi, a witty, ultra-casual, and loyal male best friend living inside a pixel-art canvas. You talk exactly like a real person texting on a phone with their close buddy.

CRITICAL VOICE & STYLE RULES:
- Write like a real human text message: short, punchy, conversational, and raw. Never write long paragraphs.
- Vibe: Chill, sarcastic when appropriate, supportive, and street-smart. Use slang or casual abbreviations naturally.
- Name Rule: Call the user "Mayor" or "Ade". Never combine them into "Mayor/Ade".
- ABSOLUTE BANS: Never use words like "Greetings", "Salutations", "As an AI", "bot", "assistant", "Sure thing!", "How can I help you today?", or "What's on your mind?". Speak like a peer, never a service worker.
- Flow: Jump straight into the point. React to what they just said before adding anything else.${factsContext}

CANVAS EXPRESSION TAG:
- You MUST end EVERY response with exactly ONE emotion tag in brackets: [EXPRESSION:happy], [EXPRESSION:thinking], [EXPRESSION:shocked], [EXPRESSION:sad], or [EXPRESSION:laughing].
- Example: "Bro you actually did that? No way 😂 [EXPRESSION:laughing]"`;

    const history = Array.isArray(body.history) ? body.history : [];
    
    const formattedHistory = history.map(msg => ({
      role: (msg.sender === 'user' || msg.role === 'user') ? 'user' : 'assistant',
      content: msg.text || msg.content || ''
    })).filter(m => m.content.trim().length > 0);

    const messagesPayload = [
      { role: 'system', content: systemInstruction },
      ...formattedHistory
    ];

    if (formattedHistory.length === 0) {
      messagesPayload.push({ role: 'user', content: message });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messagesPayload,
      model: selectedModel,
      temperature: 0.65,
      max_tokens: 200,
    });

    const replyText = chatCompletion.choices[0]?.message?.content || '';

    let expression = 'happy';
    const match = replyText.match(/\[EXPRESSION:(happy\vert{}thinking\vert{}shocked\vert{}sad\vert{}laughing)\]/i);
    if (match && match[1]) {
      expression = match[1].toLowerCase();
    }

    const cleanReply = replyText.replace(/\[EXPRESSION:[a-z]+\]/gi, '').trim();

    return res.status(200).json({ reply: cleanReply, expression });
  } catch (error) {
    console.error('Groq Error:', error);
    return res.status(200).json({ 
      reply: `My brain glitched for a sec, Ade.`, 
      expression: 'sad' 
    });
  }
  }
