import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { render } from "@testing-library/react"
import type { ComponentType } from "react"
import { vi } from "vitest"
import { LanguageProvider } from "@/i18n/language"

export type Call = { path: string; body: unknown }
type Handler = (body: unknown) => unknown

/** Stubs `fetch` like algo-server: `routes` maps an `/api` path to a JSON reply; a missing route is a 500. */
export function fakeServer(routes: Record<string, Handler>) {
  const calls: Call[] = []
  const fetch = vi.fn(async (input: string, init?: RequestInit) => {
    const path = input.replace(/^\/api/, "")
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ path, body })
    const handler = routes[path]
    if (!handler) return new Response("proxy error", { status: 500 })
    const reply = handler(body)
    if (reply instanceof Response) return reply
    return new Response(JSON.stringify(reply), { headers: { "content-type": "application/json" } })
  })
  vi.stubGlobal("fetch", fetch)
  return { calls, posts: (path: string) => calls.filter((c) => c.path === path).map((c) => c.body) }
}

export const HEALTH = { status: "ok", base_model: "gpt2", assistant_model: "gpt-test" }

export async function renderLesson(Lesson: ComponentType) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <Lesson />
        </LanguageProvider>
      </QueryClientProvider>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  })
  await router.load()
  return render(<RouterProvider router={router} />)
}
