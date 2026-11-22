import type { Request, Response } from "express";
import { speechToText } from "../services/stt.service.js";

// POST /api/stt   body = the recorded audio.
// Deepgram turns it into text and that is all: the text goes back to the shopkeeper to check and fix.
export async function transcribe(req: Request, res: Response) {
  const audio = req.body;
  if (!Buffer.isBuffer(audio) || audio.length === 0) return res.status(400).json({ message: "No audio received" });

  try {
    res.json({ text: await speechToText(audio) });
  } catch (error) {
    console.error("STT failed:", error instanceof Error ? error.message : error);
    res.status(500).json({ message: "Could not understand the audio" });
  }
}
