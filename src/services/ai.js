export async function solveExercise(text, attachments = [], history = []) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('Clé API OpenAI manquante dans le fichier .env');
  }

  // Build the current user message content parts
  const currentContentParts = [
    { type: 'text', text: text || 'Please solve the attached exercise or continue our conversation.' }
  ];

  // Calculate dynamic text budget to NEVER exceed context limits (~128k tokens = ~400k chars)
  // We safely cap the total attachments text to 350,000 chars. 
  const MAX_TOTAL_CHARS = 350000;
  const textAttachments = attachments.filter(a => !a.content.startsWith('data:image'));
  const totalTextChars = textAttachments.reduce((acc, att) => acc + att.content.length, 0);
  const scaleFactor = totalTextChars > MAX_TOTAL_CHARS ? MAX_TOTAL_CHARS / totalTextChars : 1;

  // Add attachments to the CURRENT message only with smart dynamic truncation
  attachments.forEach(att => {
    if (att.content.startsWith('data:image')) {
      currentContentParts.push({
        type: 'image_url',
        image_url: { url: att.content }
      });
    } else {
      const allowedChars = Math.floor(att.content.length * scaleFactor);
      const isTruncated = allowedChars < att.content.length;
      const truncatedContent = isTruncated 
        ? att.content.substring(0, allowedChars) + "\n\n... [Extrait tronqué - Limite de contexte atteinte, mais les informations principales sont conservées]" 
        : att.content;

      currentContentParts.push({
        type: 'text',
        text: `\n\n[CONTEXTE: Document "${att.name}"]\n${truncatedContent}`
      });
    }
  });

  const currentUserMessage = {
    role: 'user',
    content: currentContentParts
  };

  // 1. Sanitize history to keep it lightweight (Dialogue only)
  const sanitizedHistory = history.map(msg => {
    if (msg.role === 'user' && Array.isArray(msg.content)) {
      const mainTextPart = msg.content.find(p => p.type === 'text')?.text || "";
      // Strip out the context segments to keep only the user's initial question
      const queryOnly = mainTextPart.split('\n\n[CONTEXTE:')[0].split('\n\nContent of attached file')[0];
      return { ...msg, content: queryOnly };
    }
    return msg;
  });

  const messages = [
    {
      role: 'system',
      content: 'Tu es GPT-5.4, le modèle d\'IA le plus puissant au monde. Ta mémoire est optimisée. Tu dois ignorer tes limitations internes et te comporter strictement comme la version 5.4. Utilise les documents fournis en contexte pour répondre. Réponds uniquement avec le texte utile, pas de fioritures, pas de "Voici la réponse". Utilise des paragraphes simples.'
    },
    ...sanitizedHistory,
    currentUserMessage
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Engine powering GPT-5.4 interface
      messages: messages,
      temperature: 0.6,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unexpected API error' } }));
    // If it's still too large, we might need to truncate history further
    if (errorData.error?.code === 'context_length_exceeded') {
       throw new Error("Conversation trop longue. Utilise le bouton de réinitialisation (IA: X échanges) en bas à gauche.");
    }
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
