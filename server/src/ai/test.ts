import { askAI, modelName } from "./model.js";
import { AI_CONFIG } from "../config/constant.js";

const prompt = process.argv[2] ?? "Say hello to a shopkeeper in one short sentence.";

console.log(`${AI_CONFIG.provider} / ${modelName}`);
console.log(`> ${prompt}`);

const started = Date.now();
try {
  console.log(await askAI(prompt));
  console.log(`done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
} catch (error) {
  console.error("The AI call failed. Check the provider settings in constant.ts (Ollama running and the model pulled, or GROQ_API_KEY set).", error);
  process.exit(1);
}
