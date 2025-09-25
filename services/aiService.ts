// AI Service for NS AI – Gemini ONLY
// Primary and only provider: Google Gemini.

// Gemini configuration (PRIMARY PROVIDER)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyCxCiMFUW-r3Kxc7AHgQ5CjReF48qJfzqQ';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// (No OpenAI usage per request)

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

// Google Gemini API integration (PRIMARY)
export const generateWithGemini = async (prompt: string): Promise<AIResponse> => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_KEY_INVALID: Missing Gemini API key');
    }

    const instruction = [
      'You are NS AI inside a notes app.',
      'Return only what the user asked for, nothing extra.',
      'Do NOT add headings, disclaimers, or sections unless explicitly requested.',
      'Be concise, precise, and natural. Prefer short paragraphs and strong clarity.',
      'If the user asks for a description, write vivid, poetic but tight prose (no headings).',
      'If the user asks for steps or lists, use clean bullet points with concise lines.',
      'If the user asks for code, output code only without extra commentary.',
    ].join(' ');

    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];

    const buildBody = (text: string) => ({
      contents: [
        {
          parts: [
            { text: instruction },
            { text },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 900,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });

    const callModel = async (model: string, attempt: number): Promise<any> => {
      const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(prompt)),
      });
      if (!res.ok) {
        const status = res.status;
        const body = await res.text();
        if ((status === 503 || status === 429) && attempt < 3) {
          const backoffMs = Math.min(4000, 600 * Math.pow(2, attempt)) + Math.floor(Math.random() * 300);
          await new Promise(r => setTimeout(r, backoffMs));
          return callModel(model, attempt + 1);
        }
        if (status === 400 && /API key not valid/i.test(body)) {
          throw new Error('API_KEY_INVALID: Your Gemini API key is invalid or not enabled for Generative Language API.');
        }
        throw new Error(`Gemini API error: ${status} - ${body}`);
      }
      return res.json();
    };

    let data: any = null;
    let lastErr: any = null;
    for (const m of models) {
      try {
        data = await callModel(m, 1);
        if (data) break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!data) throw lastErr || new Error('All Gemini models failed');

    // Extract text
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || candidate?.parts || [];
    const text = Array.isArray(parts)
      ? parts.map((p: any) => p?.text).filter((t: any) => typeof t === 'string' && t.trim()).join('\n').trim()
      : '';
    if (text && text.length > 0) return { success: true, content: text };
    throw new Error('Invalid response format from Gemini API (no text found)');
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// (OpenAI integration removed per request)

// Main AI generation function - Gemini only
export const generateAIContent = async (prompt: string): Promise<AIResponse> => {
  return await generateWithGemini(prompt);
};

// Fallback mock response for development/testing when API is not available
export const generateMockContent = (prompt: string): string => {
  return `This is a mock response for: "${prompt}"\n\nTo get real AI responses, please configure your API key in services/aiService.ts\n\nYou can use either:\n1. Google Gemini API (free tier available)\n2. OpenAI ChatGPT API\n\nOnce configured, you'll get actual AI-generated content for any prompt you provide.`;
};
