import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      to: "/learn/$chapter/$lesson",
      params: { chapter: "programming-vs-ml", lesson: "content" },
    })
  },
})
