import { DeepgramClient } from "@deepgram/sdk";
import { env } from "../config/env.js";

// Speech to text with Deepgram. The browser sends the recording, we send it on and get the English text back.
export async function speechToText(audio: Buffer) {
  if (!env.DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY is missing in the .env file");

  const deepgram = new DeepgramClient({ apiKey: env.DEEPGRAM_API_KEY });
  const result = await deepgram.listen.v1.media.transcribeFile(audio, {
    model: "nova-3",
    language: "en",
    smart_format: true,
    // words a shopkeeper says that a general model may mishear
    keyterm: ["atta", "maida", "besan", "rava", "dal", "ghee", "basmati rice", "toor dal", "kg"],
  });

  // the response has no "results" when Deepgram sends back an error body
  return ("results" in result ? result.results.channels[0]?.alternatives?.[0]?.transcript : "")?.trim() ?? "";
}
