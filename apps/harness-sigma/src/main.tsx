import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { Toaster } from "@/components/ui/sonner"
import { routeTree } from "./routeTree.gen"
import "./index.css"

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById("root")
if (!root) throw new Error("#root element missing from index.html")

createRoot(root).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
