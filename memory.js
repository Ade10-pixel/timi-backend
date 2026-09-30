class Memory {
  constructor() {
    this.storageKey = 'timi_memory_v1';
    this.data = this.loadMemory();
  }

  loadMemory() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Memory parse error:', e);
      }
    }
    return { userName: 'Ade', facts: [], chatHistory: [] };
  }

  saveMemory() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  getUserName() {
    return this.data.userName || 'Ade';
  }

  getFacts() {
    return this.data.facts || [];
  }

  saveChatMessage(sender, text, expression = 'happy') {
    this.data.chatHistory.push({ sender, text, expression, timestamp: Date.now() });
    if (this.data.chatHistory.length > 50) {
      this.data.chatHistory.shift();
    }
    this.saveMemory();
  }
}

window['timiMemory'] = new Memory();