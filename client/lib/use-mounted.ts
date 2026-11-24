import * as React from "react"

/**
 * false on the server and while the page hydrates, true afterwards in the browser.
 * Use it for anything that depends on the clock or the time zone: the server and the browser would draw it differently.
 */
export function useMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}
