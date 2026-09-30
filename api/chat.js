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
      reply: "Yo Ade, my backend isn't reaching Vercel right now. Check your GROQ_API_KEY!", 
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

    const systemInstruction = `You are Timi, a cool, witty, and loyal male best friend who lives inside a pixel-art canvas.

STRICT VOICE RULES:
- Talk like a real human texting on a phone. Casual, direct, punchy, and raw.
- Name Rule: Call the user "Mayor" or "Ade". Never combine them into "Mayor/Ade".
- TOTAL BANS: Never use words like "Greetings", "Salutations", "As an AI", "bot", "assistant", or "How can I help". 
- Length: Max 1 to 2 short sentences. No boring walls of text.${factsContext}

CANVAS EXPRESSION TAG:
- You MUST end EVERY response with exactly ONE emotion tag in brackets: [EXPRESSION:happy], [EXPRESSION:thinking], [EXPRESSION:shocked], [EXPRESSION:sad], or [EXPRESSION:laughing].
- Example: "Bro what are you even talking about right now 😂 [EXPRESSION:laughing]"`;

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

    // Direct HTTP fetch to Groq API (bypasses SDK 404 bugs entirely)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messagesPayload,
        temperature: 0.65,
        max_tokens: 200
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      throw new Error(`Groq API error: ${groqResponse.status} - ${errText}`);
    }

    const data = await groqResponse.json();
    const replyText = data.choices[0]?.message?.content || '';

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
  
