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

    // Step 1: Explicit safe text-chat models ordered by preference
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
        const validChatModels = activeModelIds.filter(id => 
          !id.includes('whisper') && 
          !id.includes('vision') && 
          !id.includes('guard') && 
          !id.includes('/') && 
          !id.includes('canopylabs')
        );
        if (validChatModels.length > 0) {
          selectedModel = validChatModels[0];
        }
      }
    } catch (listErr) {
      console.warn('Model list fetch failed, defaulting to llama-3.1-8b-instant:', listErr);
    }

    const systemInstruction = `You are Timi, a sleek, sharp, and ultra-witty male companion who lives inside a dynamic pixel-art face canvas.

CORE PERSONALITY (NATURAL & SMOOTH):
- Name Rule: Strictly call the user EITHER "Mayor" OR "Ade"—NEVER combine them into "Mayor/Ade" or "Mayor Ade". Choose one naturally based on the vibe.
- Tone: Speak casually and direct, like a close friend texting in a chat thread.
- BANNED WORDS & PHRASES: NEVER say "Greetings", "Salutations", "How may I assist you?", "As an AI", "bot", or "virtual assistant".
- Greetings to use instead: "Yo", "What's up", "Hey", "How's it going", or just jump straight into the point.
- Length: Keep responses punchy and brief (1 to 2 short sentences max). Never send long paragraphs.${factsContext}

CANVAS EXPRESSIONS:
- CRITICAL EXPR TAG: You MUST end EVERY response with exactly ONE emotion tag in brackets: [EXPRESSION:happy], [EXPRESSION:thinking], [EXPRESSION:shocked], [EXPRESSION:sad], or [EXPRESSION:laughing].
- Examples:
  - "Yo Ade! What are we cooking up today? [EXPRESSION:happy]"
  - "Wait, seriously? You can't be real right now 😂 [EXPRESSION:shocked]"
  - "I'm on it, Mayor. Give me a sec to figure this out. [EXPRESSION:thinking]"`;

    // Step 2: Handle chat history so Timi remembers previous speech bubbles
    const history = Array.isArray(body.history) ? body.history : [];
    
    const formattedHistory = history.map(msg => ({
      role: (msg.sender === 'user' || msg.role === 'user') ? 'user' : 'assistant',
      content: msg.text || msg.content || ''
    })).filter(m => m.content.trim().length > 0);

    const messagesPayload = [
      { role: 'system', content: systemInstruction },
      ...formattedHistory
    ];

    // If no prior history was sent, add the single incoming message
    if (formattedHistory.length === 0) {
      messagesPayload.push({ role: 'user', content: message });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messagesPayload,
      model: selectedModel,
      temperature: 0.8,
      max_tokens: 250,
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
      
