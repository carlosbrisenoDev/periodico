export const DEFAULT_API_BASE_URL =
  typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.API_URL

export const API_BASE_URL =
  typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()
    ? configuredBaseUrl.trim()
    : DEFAULT_API_BASE_URL

const normalizeBaseUrl = (value) => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('Base URL no puede estar vacía.')
  }
  return trimmed.replace(/\/+$/, '')
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export const apiRequest = async (
  baseUrl,
  path,
  { method = 'GET', query, body, formData, signal } = {},
) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(normalizedPath, `${normalizedBaseUrl}/`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const options = {
    method,
    credentials: 'include',
    headers: {},
    signal,
  }

  if (formData) {
    options.body = formData
  } else if (!['GET', 'HEAD'].includes(method) && body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const responseText = await response.text()
  const contentType = response.headers.get('content-type') ?? ''
  const payload =
    contentType.includes('application/json') && responseText
      ? JSON.parse(responseText)
      : responseText

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String(payload.message)
        : `Error HTTP ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  return payload
}
