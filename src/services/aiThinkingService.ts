export interface AiThinkOptions {
  prompt: string;
  systemInstruction?: string;
}

export async function generateHighThinkingResponse(options: AiThinkOptions): Promise<string> {
  const response = await fetch('/api/ai/think', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  const data = await response.json();
  return data.result || '';
}
