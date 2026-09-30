async function sendMessageToTimi(userMessage) {
  const memoryInstance = window['timiMemory'];
  const userName = memoryInstance ? memoryInstance.getUserName() : 'Ade';
  const userFacts = memoryInstance ? memoryInstance.getFacts() : [];
  
  // Grab the last 6 messages from local storage memory for conversation context
  const history = memoryInstance ? memoryInstance.data.chatHistory.slice(-6) : [];

  try {
    const response = await fetch('https://timi-backend.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        userName,
        userFacts,
        history // Sending history to Vercel so Timi remembers you!
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Brain fetch error:', error);
    return {
      reply: "Yo Ade, my backend isn't reaching Vercel right now. Check your connection!",
      expression: 'sad'
    };
  }
}

window['sendMessageToTimi'] = sendMessageToTimi;
