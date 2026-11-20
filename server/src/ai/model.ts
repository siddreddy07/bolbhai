import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { AI_CONFIG, AI_SYSTEM_PROMPT } from "../config/constant.js";
import { env } from "../config/env.js";

// The name of the model in use, for logs and the test script.
export const modelName = AI_CONFIG.models[AI_CONFIG.provider];

// Builds the model for the provider chosen in AI_CONFIG.
function getModel() {
  switch (AI_CONFIG.provider) {
    case "ollama":
      return createOllama({ baseURL: AI_CONFIG.ollamaBaseURL })(AI_CONFIG.models.ollama);
    case "groq":
      if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing in the .env file");
      return createGroq({ apiKey: env.GROQ_API_KEY })(AI_CONFIG.models.groq);
  }
}

// Asks the model one question and returns its answer as text.
export async function askAI(prompt: string) {
  const { text } = await generateText({
    model: getModel(),
    system: AI_SYSTEM_PROMPT,
    prompt,
    // Ollama can switch thinking on or off; Groq ignores this.
    providerOptions: AI_CONFIG.provider === "ollama" ? { ollama: { think: AI_CONFIG.thinking } } : {},
  });
  // Some models (like the always-thinking qwen3:4b) ignore think: false and put their reasoning
  // before a closing </think> tag. Keep only the answer.
  return text.split("</think>").pop()!.trim();
}
