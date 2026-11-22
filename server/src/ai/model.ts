import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { AI_CONFIG, AI_SYSTEM_PROMPT } from "../config/constant.js";
import { env } from "../config/env.js";

const ollamaURL = env.OLLAMA_BASE_URL || AI_CONFIG.ollamaBaseURL;

export const modelName = AI_CONFIG.models[AI_CONFIG.provider];

// Only Ollama has a thinking switch.
export const aiOptions: Record<string, { think: boolean }> = AI_CONFIG.provider === "ollama" ? { ollama: { think: AI_CONFIG.thinking } } : {};

// Gives the model chosen in constant.ts.
export function getModel() {
  if (AI_CONFIG.provider === "ollama") {
    return createOllama({ baseURL: ollamaURL })(AI_CONFIG.models.ollama);
  }
  if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing in .env");
  return createGroq({ apiKey: env.GROQ_API_KEY })(AI_CONFIG.models.groq);
}

// Is the chosen model ready to answer? Checked before the paid or slow steps (like the Deepgram call).
export async function checkModel(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (AI_CONFIG.provider === "groq") {
    return env.GROQ_API_KEY ? { ok: true } : { ok: false, reason: "GROQ_API_KEY is missing in .env" };
  }

  try {
    const res = await fetch(`${ollamaURL}/tags`, { signal: AbortSignal.timeout(3000) }); // the models Ollama has
    if (!res.ok) return { ok: false, reason: `Ollama answered with status ${res.status}` };
    const { models } = (await res.json()) as { models: { name: string }[] };
    const wanted = AI_CONFIG.models.ollama;
    if (!models.some((m) => m.name === wanted || m.name === `${wanted}:latest`)) {
      return { ok: false, reason: `Ollama is running, but the model "${wanted}" is not pulled (run: ollama pull ${wanted})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: `Cannot reach Ollama at ${ollamaURL}. Is it running?` };
  }
}

// Asks one question, returns the answer text.
export async function askAI(question: string) {
  const { text } = await generateText({
    model: getModel(),
    system: AI_SYSTEM_PROMPT,
    prompt: question,
    providerOptions: aiOptions,
  });
  return text.split("</think>").pop()!.trim(); // drop any "thinking" some models print first
}
