import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>harness-sigma</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Hello, harness-sigma</Button>
        </CardContent>
      </Card>
    </div>
  )
}
