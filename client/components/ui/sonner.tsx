"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

// Glass toasts: a see-through tinted surface, the page blurred behind it, and a hairline light edge.
// Success leans green and failure leans red, so a glance tells which one it is.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px]" />,
        info: <InfoIcon className="size-[18px]" />,
        warning: <TriangleAlertIcon className="size-[18px]" />,
        error: <OctagonXIcon className="size-[18px]" />,
        loading: <Loader2Icon className="size-[18px] animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "color-mix(in oklab, var(--popover) 55%, transparent)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border":
            "color-mix(in oklab, var(--foreground) 14%, transparent)",
          "--success-bg":
            "color-mix(in oklab, #2fb26a 24%, var(--popover) 40%)",
          "--success-border": "color-mix(in oklab, #2fb26a 45%, transparent)",
          "--success-text": "var(--popover-foreground)",
          "--error-bg": "color-mix(in oklab, #e5482a 24%, var(--popover) 40%)",
          "--error-border": "color-mix(in oklab, #e5482a 45%, transparent)",
          "--error-text": "var(--popover-foreground)",
          "--border-radius": "1.25rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !backdrop-blur-xl !backdrop-saturate-150 !shadow-[0_18px_40px_-14px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.28)]",
          title: "!font-semibold",
          description: "!text-popover-foreground/70",
          actionButton:
            "!h-8 !rounded-full !bg-foreground !px-3.5 !text-[13px] !font-semibold !text-background",
          cancelButton:
            "!h-8 !rounded-full !bg-foreground/10 !px-3.5 !text-[13px] !font-semibold !text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
