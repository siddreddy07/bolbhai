import axios, { type InternalAxiosRequestConfig } from "axios"

// Must match TOKEN_EXPIRED_STATUS in the server's src/config/constant.ts.
const TOKEN_EXPIRED_STATUS = 498

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // send and receive the auth cookies
})

let refreshing: Promise<unknown> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { retried?: boolean }) | undefined

    if (error.response?.status !== TOKEN_EXPIRED_STATUS || !original || original.retried) {
      return Promise.reject(error)
    }
    original.retried = true

    try {
      // one refresh call, shared by every request that expired at the same time
      refreshing ??= api.post("/api/users/refresh").finally(() => (refreshing = null))
      await refreshing
      return api(original)
    } catch (refreshError) {
      // the refresh token is gone too: on a logged-in page, send them back to log in
      if (window.location.pathname.startsWith("/dashboard")) window.location.replace("/get-started")
      return Promise.reject(refreshError)
    }
  }
)
