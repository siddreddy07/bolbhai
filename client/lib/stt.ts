import { api } from "@/lib/proxy"

let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let chunks: Blob[] = []
let captions: { stop(): void } | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
const samples = new Uint8Array(512)

/** How loud the microphone is right now, from 0 (silence) to 1 (loud). The mic button reads this to move. */
export function getMicLevel() {
  if (!analyser) return 0
  analyser.getByteTimeDomainData(samples)
  let sum = 0
  for (const v of samples) {
    const x = (v - 128) / 128
    sum += x * x
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 4)
}

function closeAnalyser() {
  void audioContext?.close()
  audioContext = null
  analyser = null
}

/** Live captions while talking, straight from the browser (Chrome and Edge). It is only for show: the real text comes from the server. */
type Recognizer = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (e: {
    results: ArrayLike<ArrayLike<{ transcript: string }>>
  }) => void
  onend: () => void
  onerror: (e: { error: string }) => void
  start(): void
  stop(): void
}
type RecognizerWindow = {
  SpeechRecognition?: new () => Recognizer
  webkitSpeechRecognition?: new () => Recognizer
}

function startCaptions(
  onText: (text: string) => void,
  onProblem: (why: string) => void
) {
  const w = window as unknown as RecognizerWindow
  const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition
  if (!Recognition)
    return onProblem(
      "This browser cannot show live captions. Use Chrome or Edge."
    )
  const r = new Recognition()
  r.continuous = true
  r.interimResults = true
  r.lang = "en-IN"
  r.onresult = (e) =>
    onText(Array.from(e.results, (x) => x[0].transcript).join(" "))
  r.onend = () => captions && r.start() // it stops by itself after a pause: start again
  r.onerror = (e) => {
    console.warn("Live captions error:", e.error)
    if (e.error === "no-speech" || e.error === "aborted") return // normal: nobody spoke yet
    onProblem(
      e.error === "network"
        ? "Live captions need internet (Chrome sends the audio to Google)"
        : `Live captions stopped (${e.error})`
    )
  }
  r.start()
  captions = r
}

function stopCaptions() {
  const r = captions
  captions = null
  r?.stop()
}

/** Asks for the microphone and starts recording. Throws if the user says no. */
export async function startRecording(
  onCaption: (text: string) => void,
  onCaptionProblem: (why: string) => void
) {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  chunks = []
  audioContext = new AudioContext()
  void audioContext.resume()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = samples.length
  audioContext.createMediaStreamSource(stream).connect(analyser)
  recorder = new MediaRecorder(stream)
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  recorder.start()
  startCaptions(onCaption, onCaptionProblem)
}

/** Stops recording and gives back the audio. */
export function stopRecording() {
  return new Promise<Blob>((resolve) => {
    stopCaptions()
    closeAnalyser()
    if (!recorder) return resolve(new Blob())
    recorder.onstop = () => {
      stream?.getTracks().forEach((t) => t.stop()) // turns the mic light off
      resolve(new Blob(chunks, { type: recorder?.mimeType || "audio/webm" }))
      recorder = null
    }
    recorder.stop()
  })
}

/** Throws the recording away (the user cancelled). */
export function cancelRecording() {
  stopCaptions()
  closeAnalyser()
  if (recorder)
    recorder.onstop = () => stream?.getTracks().forEach((t) => t.stop())
  if (recorder?.state === "recording") recorder.stop()
  recorder = null
}

/** One thing the shopkeeper asked for, with the ids of the shelf items that fit (the page fills in the rest from its saved inventory). */
export type OrderItem = {
  query: string
  quantity: number | null
  unit: string | null
  options: { id: string; productId: string | null }[]
}

/** Step 1: only the audio goes to the server. Deepgram writes the text and that text comes back to be checked. */
export async function transcribe(audio: Blob) {
  const { data } = await api.post<{ text: string }>("/api/stt", audio, {
    headers: { "Content-Type": audio.type || "audio/webm" },
  })
  return data.text
}

/** Step 2: the shopkeeper pressed Confirm. The (maybe edited) text goes to the order graph, which looks in this shop's inventory; the items come back. */
export async function confirmOrder(shopId: string, text: string) {
  const { data } = await api.post<{ order: OrderItem[] }>(
    "/api/orders/confirm",
    { shopId, text }
  )
  return data.order
}
