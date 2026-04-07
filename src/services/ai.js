export async function solveExercise(text, attachments = []) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here' || !apiKey) {
    throw new Error('Clé API OpenAI manquante dans le fichier .env');
  }

  // Build the message content parts
  const contentParts = [
    { type: 'text', text: text || 'Please solve the attached exercise.' }
  ];

  // Add attachments
  attachments.forEach(att => {
    if (att.content.startsWith('data:image')) {
      // Vision input
      contentParts.push({
        type: 'image_url',
        image_url: { url: att.content }
      });
    } else {
      // Text attachment
      contentParts.push({
        type: 'text',
        text: `\n\nContent of attached file "${att.name}":\n${att.content}`
      });
    }
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5.4',
      messages: [
        {
          role: 'system',
          content: 'You are an educational assistant. The user will provide an exercise or a question, possibly with images or text files. Some attachments may be course slides or background material; use them as context if they are relevant to solving the user question. Respond in simple, natural English with a clear structure. Do not use bullet points or any markdown formatting except for paragraph breaks. Provide only the text ready to be copied into a document. Do not add conversational filler like "Here is the answer".'
        },
        {
          role: 'user',
          content: contentParts
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unexpected API error' } }));
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
