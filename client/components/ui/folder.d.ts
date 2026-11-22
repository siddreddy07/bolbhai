import type * as React from "react"

export type FolderItem =
  | string
  | { title?: string; description?: string; image?: string; alt?: string; content?: React.ReactNode }
  | React.ReactElement

export interface FolderProps {
  items?: FolderItem[]
  label?: string
  mode?: "flap" | "book"
  variant?: "solid" | "glass" | "matte"
  color?: string
  paperColor?: string
  tabPosition?: "left" | "center" | "right"
  layout?: "spread" | "stack" | "row"
  size?: number
  openOn?: "click" | "hover"
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onItemClick?: (item: FolderItem, index: number) => void
  onItemDrop?: (item: FolderItem, index: number, inside: boolean) => void
  draggable?: boolean
  zoomOnClick?: boolean
  peek?: boolean
  intro?: boolean
  tilt?: number
  bounce?: number
  speed?: number
  frost?: number
  closeOnOutsideClick?: boolean
  theme?: "dark" | "light"
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

declare const Folder: (props: FolderProps) => React.JSX.Element
export default Folder
