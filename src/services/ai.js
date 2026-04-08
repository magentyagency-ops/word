export async function solveExercise(text, attachments = [], history = []) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('Clé API OpenAI manquante dans le fichier .env');
  }

  // Build the current user message content parts
  const currentContentParts = [
    { type: 'text', text: text || 'Please solve the attached exercise or continue our conversation.' }
  ];

  // Add attachments to the CURRENT message only
  attachments.forEach(att => {
    if (att.content.startsWith('data:image')) {
      currentContentParts.push({
        type: 'image_url',
        image_url: { url: att.content }
      });
    } else {
      currentContentParts.push({
        type: 'text',
        text: `\n\n[CONTEXT: Document "${att.name}"]\n${att.content}`
      });
    }
  });

  const currentUserMessage = {
    role: 'user',
    content: currentContentParts
  };

  // 1. Sanitize history to prevent context overflow
  // We keep the history of dialogue, but strip out the massive PDF data from PREVIOUS turns
  const sanitizedHistory = history.map(msg => {
    if (msg.role === 'user' && Array.isArray(msg.content)) {
      // Find the main text part
      const mainTextPart = msg.content.find(p => p.type === 'text')?.text || "";
      // Keep only the actual query, discard anything after the first [CONTEXT: or Content of attached...
      const queryOnly = mainTextPart.split('\n\n[CONTEXT:')[0].split('\n\nContent of attached file')[0];
      return { ...msg, content: queryOnly };
    }
    return msg;
  });

  const messages = [
    {
      role: 'system',
      content: 'You are an educational assistant (GPT-5.4). Remember previous turns. Use CURRENT attachments as context. Always respond in the user\'s language. Output: simple text paragraphs, no markdown bullets, no filler.'
    },
    ...sanitizedHistory,
    currentUserMessage
  ];

  // Debug check
  console.log('--- AI OPTIMIZED REQUEST ---');
  console.log(`History: ${sanitizedHistory.length} messages`);
  console.log(`Current Parts: ${currentContentParts.length}`);
  console.log('---------------------------');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unexpected API error' } }));
    console.error('API Error Response:', errorData);
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  const assistantAnswer = data.choices[0].message.content.trim();

  return {
    answer: assistantAnswer,
    userMessageSent: currentUserMessage,
    assistantMessageReceived: { role: 'assistant', content: assistantAnswer }
  };
}
