import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/handlers'

const crearStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
}

const mockLocal = crearStorage()
const mockSession = crearStorage()

Object.defineProperty(window, 'localStorage', { value: mockLocal, configurable: true, writable: true })
Object.defineProperty(window, 'sessionStorage', { value: mockSession, configurable: true, writable: true })
Object.defineProperty(globalThis, 'localStorage', { value: mockLocal, configurable: true, writable: true })
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSession, configurable: true, writable: true })

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  mockLocal.clear()
  mockSession.clear()
})
afterAll(() => server.close())
