async function sendMessageToTimi(userMessage) {
  const memoryInstance = window['timiMemory'];
  const userName = memoryInstance ? memoryInstance.getUserName() : 'Ade';
  const userFacts = memoryInstance ? memoryInstance.getFacts() : [];

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        userName,
        userFacts
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
      reply: "Yo Ade, my backend brain isn't reaching Vercel right now. Double check the API key on your dashboard!",
      expression: 'sad'
    };
  }
}

window['sendMessageToTimi'] = sendMessageToTimi;
