import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

// The picture shown when the link is shared (WhatsApp, X, LinkedIn, Google): the BolBhai mascot and the tagline.
export const alt = "BolBhai: don't type, bol de bhai"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const mascot = await readFile(
    join(process.cwd(), "public/mascot/bolbhai.png")
  )
  const src = `data:image/png;base64,${mascot.toString("base64")}`

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 90px",
        background: "#bfe8c4",
        color: "#10301f",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1 }}>
          BolBhai
        </div>
        <div style={{ fontSize: 60, marginTop: 28, lineHeight: 1.1 }}>
          Don’t type.
        </div>
        <div style={{ fontSize: 60, lineHeight: 1.1, color: "#d4381a" }}>
          Bol de, bhai.
        </div>
        <div style={{ fontSize: 30, marginTop: 36, opacity: 0.75 }}>
          Voice billing, stock and khata for shopkeepers
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={378} height={480} alt="" />
    </div>,
    { ...size }
  )
}
