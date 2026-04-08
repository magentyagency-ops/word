export async function solveExercise(text, attachments = [], history = []) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here' || !apiKey) {
    throw new Error('Clé API OpenAI manquante dans le fichier .env');
  }

  // Build the current user message content parts
  const currentContentParts = [
    { type: 'text', text: text || 'Please solve the attached exercise or continue our conversation.' }
  ];

  // Add attachments to the current user message
  attachments.forEach(att => {
    if (att.content.startsWith('data:image')) {
      currentContentParts.push({
        type: 'image_url',
        image_url: { url: att.content }
      });
    } else {
      currentContentParts.push({
        type: 'text',
        text: `\n\nContent of attached file "${att.name}":\n${att.content}`
      });
    }
  });

  const currentUserMessage = {
    role: 'user',
    content: currentContentParts
  };

  const messages = [
    {
      role: 'system',
      content: 'You are an educational assistant. This is a conversation; remember previous turns. Use provided attachments as context. Always respond in the SAME language the user uses. Do not use markdown bullet points, only paragraph breaks. Provide only the helpful text ready for insertion. No filler.'
    },
    ...history,
    currentUserMessage
  ];

  // Debug check: See what is being sent to the AI
  console.log('--- AI CONTEXT ---');
  console.log(`History length: ${history.length} messages`);
  console.log('Current message:', currentUserMessage);
  console.log('-----------------');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unexpected API error' } }));
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  const assistantAnswer = data.choices[0].message.content.trim();

  // Return both the answer AND the message objects to allow App.jsx to update history correctly
  return {
    answer: assistantAnswer,
    userMessageSent: currentUserMessage,
    assistantMessageReceived: { role: 'assistant', content: assistantAnswer }
  };
}
