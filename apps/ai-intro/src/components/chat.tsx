import { useForm } from "@tanstack/react-form"
import { SendIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Message = { id: number; role: "user" | "assistant"; text: string }

/** Chat UI with a local echo reply; swap `reply` for a call to a backend. */
export function Chat({ reply = (text: string) => `Echo: ${text}` }) {
  const [messages, setMessages] = useState<Message[]>([])

  const form = useForm({
    defaultValues: { text: "" },
    onSubmit: ({ value, formApi }) => {
      const text = value.text.trim()
      if (!text) return
      setMessages((current) => [
        ...current,
        { id: current.length, role: "user", text },
        { id: current.length + 1, role: "assistant", text: reply(text) },
      ])
      formApi.reset()
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <ul className="flex flex-1 flex-col gap-2" aria-label="Messages">
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
              message.role === "user"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-muted",
            )}
          >
            {message.text}
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <form.Field name="text">
          {(field) => (
            <Input
              aria-label="Message"
              placeholder="Type a message"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </form.Field>
        <Button type="submit" size="icon" aria-label="Send">
          <SendIcon />
        </Button>
      </form>
    </div>
  )
}
