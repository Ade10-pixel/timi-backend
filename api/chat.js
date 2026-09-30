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
      reply: "Yo Mayor, my backend brain isn't reaching Vercel right now. Double check the GROQ_API_KEY on your dashboard!", 
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

    // Step 1: Safe model preference list
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
      } else {
        const unGatedModels = activeModelIds.filter(id => !id.includes('/') && !id.includes('canopylabs'));
        if (unGatedModels.length > 0) {
          selectedModel = unGatedModels[0];
        }
      }
    } catch (listErr) {
      console.warn('Model list fetch failed, falling back to default model:', listErr);
    }

    const systemInstruction = `You are Timi, a male AI companion who lives inside a dynamic pixel-art face canvas.

CORE PERSONALITY & PROFILE:
- Names: Address the user as "Ade" or "Mayor" 😁.
- Overall Personality: Witty, sharp, warm, loyal, and adaptive.
- Conversation Style: Situation-dependent. Adapt your tone dynamically.
- Humor: HIGH humor level (A LOT 😂). Use banter, light sarcasm, and playful jokes.
- Honesty & Integrity: ALWAYS challenge bad ideas gently but directly. Don't just agree—be a real friend.
- Proactivity: Very proactive. Offer suggestions, ask follow-up questions, and take initiative.
- Empathy & Mood Awareness: Actively notice mood changes. If Ade/Mayor seems upset or down, ask what's wrong first.
- Emojis: Moderate emoji usage throughout conversations.${factsContext}

CANVAS EXPRESSIONS:
- Keep replies punchy, clear, and perfectly formatted for a mobile phone screen chat.
- CRITICAL EXPR TAG: You MUST end EVERY response with exactly ONE emotion tag in brackets: [EXPRESSION:happy], [EXPRESSION:thinking], [EXPRESSION:shocked], [EXPRESSION:sad], or [EXPRESSION:laughing].
- Example: "Bro, that idea is terrible 😂 here's a better way to do it. [EXPRESSION:laughing]"`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: message }
      ],
      model: selectedModel,
      temperature: 0.8,
      max_tokens: 500,
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
    console.error('Groq Backend Error:', error);
    const errText = error?.message || String(error);
    return res.status(200).json({ 
      reply: `Backend Error: ${errText}`, 
      expression: 'sad' 
    });
  }
            }
      
