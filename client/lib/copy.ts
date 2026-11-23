export const BRAND = "BolBhai"

export const LISTENING = "Listening…"

/**
 * The demo video on the home page. Paste the link between the quotes: a YouTube or Vimeo link, or a video file (.mp4, .webm).
 * Left empty, the page shows a "coming soon" screen.
 */
export const DEMO_VIDEO_URL =
  "https://res.cloudinary.com/dtgf2auzt/video/upload/v1795447751/bolbhai_final_rjverw.mp4"

/** The one demo order, as the shopkeeper says it. */
export const SPOKEN = "Ramesh took 5 bags of rice. Make his bill."

/** The tagline, two lines. */
export const TAGLINE = ["Don’t type.", "Bol de, bhai."]

/** What the shopkeeper says on each job card. */
export const JOB_SAY: Record<string, string> = {
  stock: "20 bags of rice came in",
  purchases: "bought 30 bags of sugar",
  bills: "make a bill for Ramesh",
  khata: "Ramesh paid two thousand",
  reports: "show me today's sales",
  ask: "how much rice is left?",
}
