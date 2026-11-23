"use client"

import * as React from "react"
import { LoaderCircle, Search, X } from "lucide-react"

import { api } from "@/lib/proxy"
import { cn } from "@/lib/utils"

/**
 * One search box with a results menu, to plug in anywhere.
 *
 *   <SearchBox<Product>
 *     url="/api/products/search"                      // the route to hit
 *     params={{ shopId }}                             // optional extras, sent with every search
 *     pick={(data) => data.products}                  // how the response becomes a list (default below)
 *     getKey={(p) => p.id}
 *     getLabel={(p) => p.name}
 *     getHint={(p) => `${p.quantity} ${p.unit}`}      // optional small text on the right
 *     onSelect={(p) => add(p)}
 *   />
 *
 * It waits for you to stop typing (`delay`), cancels a search that is no longer needed, remembers
 * answers it already has (the same words never hit the route twice), and the menu shows loading,
 * results, an empty note, or the error with a retry. Arrow keys, Enter and Escape work.
 */

export type SearchBoxProps<T> = {
  /** the route to hit, e.g. "/api/products/search" */
  url: string
  /** the query-string key the typed text goes under */
  param?: string
  /** extra query-string values sent with every search */
  params?: Record<string, string | number | undefined>
  /** response body -> the list. Default: the body itself, or its `items` / `results` / `data` array */
  pick?: (data: any) => T[] // eslint-disable-line @typescript-eslint/no-explicit-any
  getKey: (item: T) => string
  getLabel: (item: T) => string
  /** small text on the right of a row */
  getHint?: (item: T) => React.ReactNode
  /** a fully custom row (replaces label and hint) */
  renderItem?: (item: T, state: { active: boolean }) => React.ReactNode
  onSelect: (item: T) => void
  placeholder?: string
  /** fewest characters before a search is sent */
  minChars?: number
  /** ms to wait after the last keystroke */
  delay?: number
  /** empty the box after something is picked */
  clearOnSelect?: boolean
  autoFocus?: boolean
  className?: string
  /** controlled text: the parent owns what is typed (optional) */
  value?: string
  onValueChange?: (text: string) => void
  /** change this to forget remembered answers (e.g. after the data behind the route changed) */
  cacheKey?: string | number
  /** when set, every search logs to the console as `[label] "text" -> API hit | cache hit` */
  logLabel?: string
}

// answers already fetched, shared by every box; key = route + params + text
// What a search found is kept in the browser's localStorage for 1 minute, so the same search is not asked twice.
const KEEP_MS = 60_000
const cache = {
  get(key: string): unknown[] | undefined {
    if (typeof window === "undefined") return undefined
    try {
      const raw = window.localStorage.getItem(`bb-search:${key}`)
      if (!raw) return undefined
      const saved = JSON.parse(raw) as { at: number; list: unknown[] }
      if (Date.now() - saved.at < KEEP_MS) return saved.list
      window.localStorage.removeItem(`bb-search:${key}`) // older than a minute
    } catch {
      // storage full or blocked: just search again
    }
    return undefined
  },
  has(key: string) {
    return this.get(key) !== undefined
  },
  set(key: string, list: unknown[]) {
    try {
      window.localStorage.setItem(
        `bb-search:${key}`,
        JSON.stringify({ at: Date.now(), list })
      )
    } catch {
      // storage full or blocked: it is simply not remembered
    }
  },
}

function defaultPick(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const d = data as Record<string, unknown> | null
  for (const k of ["items", "results", "data"])
    if (Array.isArray(d?.[k])) return d![k] as unknown[]
  return []
}

export function SearchBox<T>({
  url,
  param = "q",
  params,
  pick,
  getKey,
  getLabel,
  getHint,
  renderItem,
  onSelect,
  placeholder = "Search",
  minChars = 2,
  delay = 400,
  clearOnSelect = false,
  autoFocus,
  className,
  value,
  onValueChange,
  cacheKey,
  logLabel,
}: SearchBoxProps<T>) {
  const id = React.useId()
  const root = React.useRef<HTMLDivElement>(null)
  const [inner, setInner] = React.useState("")
  const text = value ?? inner
  const setText = (v: string) => {
    setInner(v)
    onValueChange?.(v)
  }
  const [term, setTerm] = React.useState("") // `text`, after the pause
  const [open, setOpen] = React.useState(false)
  const [at, setAt] = React.useState(0) // highlighted row
  const [failed, setFailed] = React.useState<{
    key: string
    message: string
  } | null>(null)
  const [, bump] = React.useReducer((n: number) => n + 1, 0)
  const [retry, setRetry] = React.useState(0)

  // the latest props, so the fetch effect does not restart when a parent re-renders with new functions
  const live = React.useRef({ pick, params, logLabel })
  React.useEffect(() => {
    live.current = { pick, params, logLabel }
  })

  const extra = JSON.stringify(params ?? {})
  const clean = term.trim()
  const ready = clean.length >= minChars
  const key = `${url}|${param}|${extra}|${cacheKey ?? ""}|${clean.toLowerCase()}`
  const items =
    (ready ? (cache.get(key) as T[] | undefined) : undefined) ?? null
  const error = failed?.key === key ? failed.message : null
  const loading = ready && !items && !error
  // typed something new and still waiting for the pause: show the spinner already
  const waiting = text.trim() !== clean && text.trim().length >= minChars

  // wait for a pause in typing
  React.useEffect(() => {
    const t = window.setTimeout(() => setTerm(text), delay)
    return () => window.clearTimeout(t)
  }, [text, delay])

  // hit the route (unless the answer is already remembered)
  React.useEffect(() => {
    if (!ready) return
    if (cache.has(key)) {
      if (live.current.logLabel)
        console.log(
          `[${live.current.logLabel}] "${clean}" -> cache hit (no API call)`
        )
      return
    }
    const ctrl = new AbortController()
    if (live.current.logLabel)
      console.log(`[${live.current.logLabel}] "${clean}" -> API hit (${url})`)
    api
      .get(url, {
        params: { ...live.current.params, [param]: clean },
        signal: ctrl.signal,
      })
      .then(({ data }) => {
        const list = (live.current.pick ?? defaultPick)(data)
        cache.set(key, Array.isArray(list) ? list : [])
        bump()
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return
        setFailed({
          key,
          message:
            e?.response?.data?.message ?? e?.message ?? "Could not search",
        })
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retry])

  // click outside closes the menu
  React.useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) =>
      !root.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [open])

  const choose = (item: T) => {
    onSelect(item)
    setOpen(false)
    if (clearOnSelect) {
      setText("")
      setTerm("")
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = items ?? []
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setAt((i) => Math.min(i + 1, list.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setAt((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && open && list[at]) {
      e.preventDefault()
      choose(list[at])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  // keep the highlighted row in view
  React.useEffect(() => {
    document.getElementById(`${id}-${at}`)?.scrollIntoView({ block: "nearest" })
  }, [at, id])

  const showMenu = open && ready
  return (
    <div ref={root} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={`${id}-list`}
          aria-activedescendant={
            showMenu && items?.[at] ? `${id}-${at}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value)
            setAt(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-full border border-foreground/15 bg-card pr-10 pl-9 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-foreground/50 focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <span className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center">
          {loading || waiting ? (
            <LoaderCircle
              className="size-4 animate-spin text-muted-foreground"
              aria-label="Searching"
            />
          ) : text ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setText("")
                setTerm("")
              }}
              className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </span>
      </div>

      {showMenu && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-foreground/10 bg-popover text-popover-foreground shadow-[0_18px_40px_-16px_rgb(0_0_0/0.45)]">
          {error ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 px-3.5 py-3 text-sm"
            >
              <span className="text-destructive">{error}</span>
              <button
                type="button"
                onClick={() => {
                  setFailed(null)
                  setRetry((n) => n + 1)
                }}
                className="shrink-0 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <p className="px-3.5 py-3 text-sm text-muted-foreground">
              Searching…
            </p>
          ) : items && items.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-muted-foreground">
              Nothing found for “{clean}”.
            </p>
          ) : (
            <ul
              id={`${id}-list`}
              role="listbox"
              className="max-h-72 overflow-y-auto overscroll-contain p-1"
            >
              {items?.map((item, i) => (
                <li
                  key={getKey(item)}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={i === at}
                  onPointerEnter={() => setAt(i)}
                  onClick={() => choose(item)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-sm",
                    i === at && "bg-foreground/[0.07]"
                  )}
                >
                  {renderItem ? (
                    renderItem(item, { active: i === at })
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {getLabel(item)}
                      </span>
                      {getHint && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {getHint(item)}
                        </span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
