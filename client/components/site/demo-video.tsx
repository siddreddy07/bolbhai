"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Mascot } from "@/components/site/mascot"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { DEMO_VIDEO_URL } from "@/lib/copy"

/** A YouTube or Vimeo link becomes its player address. Anything else is treated as a video file (.mp4, .webm). */
function playerFor(url: string): { kind: "frame" | "file"; src: string } {
  const youtube = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/
  )
  if (youtube)
    return {
      kind: "frame",
      src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1&rel=0`,
    }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo)
    return {
      kind: "frame",
      src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`,
    }
  return { kind: "file", src: url }
}

/**
 * The "Watch the demo" button. Tapping it opens a dialog with the demo video, playing at once.
 * Closing the dialog (the cross, Esc, or a tap outside) removes the player, so the video stops.
 * With no link in lib/copy.ts the dialog shows a "coming soon" screen.
 */
export function WatchDemo({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  const url = DEMO_VIDEO_URL.trim()
  const player = url ? playerFor(url) : null

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Watch the demo
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(960px,calc(100%-1.5rem))] rounded-[1.25rem] border-0 bg-[#10301f] p-2 text-[#f8f8f3] sm:rounded-[1.5rem] sm:p-3">
          <DialogTitle className="sr-only">BolBhai demo video</DialogTitle>
          <DialogDescription className="sr-only">
            A one minute video of a shopkeeper making a bill by voice.
          </DialogDescription>

          <div className="flex items-center justify-between pr-1 pb-2 pl-2 sm:pb-3">
            <p className="font-hand text-2xl leading-none">BolBhai in one minute</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the video"
              className="grid size-9 place-items-center rounded-full hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-signal focus-visible:outline-none"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* the screen: always 16:9, from a phone to a big monitor */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black sm:rounded-2xl">
            {player ? (
              player.kind === "frame" ? (
                <iframe
                  src={player.src}
                  title="BolBhai demo video"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 size-full border-0"
                />
              ) : (
                <video
                  src={player.src}
                  controls
                  autoPlay
                  playsInline
                  className="absolute inset-0 size-full object-contain"
                />
              )
            ) : (
              <div className="absolute inset-0 bg-mint text-[#10301f]">
                <Mascot className="absolute bottom-0 left-1/2 h-[68%] w-auto max-w-none -translate-x-1/2" />
                <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#10301f] px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-[#f8f8f3] sm:top-6">
                  Demo aa raha hai. Thoda sabr.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
