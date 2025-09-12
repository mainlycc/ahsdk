"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Send, User, Bot, X, LogOut } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

interface FileAttachment {
  file: File
  preview?: string
  type: "image" | "document"
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Ładowanie...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    files.forEach((file) => {
      const attachment: FileAttachment = {
        file,
        type: file.type.startsWith("image/") ? "image" : "document",
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        attachment.preview = e.target?.result as string
        setAttachments((prev) => [...prev, attachment])
      }

      if (attachment.type === "image") {
        reader.readAsDataURL(file)
      } else {
        reader.readAsDataURL(file)
      }
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          attachments: attachments.map((att) => ({
            name: att.file.name,
            type: att.file.type,
            data: att.preview, // This now contains base64 data
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Błąd podczas komunikacji z API")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Brak odpowiedzi z serwera")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                done = true
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.choices?.[0]?.delta?.content) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + parsed.choices[0].delta.content }
                        : msg,
                    ),
                  )
                }
              } catch (e) {
                // Ignore parsing errors for non-JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Błąd:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości.",
        },
      ])
    } finally {
      setIsLoading(false)
      setAttachments([])
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-center">Chat AI</h1>
            <p className="text-muted-foreground text-center mt-2">Zadaj pytanie lub dodaj pliki/zdjęcia jako kontekst</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Zalogowany jako: {user.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj
            </Button>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Rozpocznij rozmowę lub dodaj pliki do analizy</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          {attachments.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative bg-muted rounded-lg p-2 flex items-center gap-2">
                    {attachment.type === "image" && attachment.preview ? (
                      <Image
                        src={attachment.preview || "/placeholder.svg"}
                        alt={attachment.file.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                        <Paperclip className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-sm truncate max-w-[100px]">{attachment.file.name}</span>
                    <Button size="sm" variant="ghost" className="w-6 h-6 p-0" onClick={() => removeAttachment(index)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-4 h-4" />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Napisz wiadomość..."
              className="flex-1"
              disabled={isLoading}
            />

            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
