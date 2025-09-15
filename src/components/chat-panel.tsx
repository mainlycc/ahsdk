"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Send, User, Bot, X, Trash2 } from "lucide-react"
import Image from "next/image"

interface FileAttachment {
  file: File
  preview?: string
  type: "image" | "document"
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  attachments?: FileAttachment[]
}

interface ChatPanelProps {
  user: any
}

export function ChatPanel({ user }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll do końca gdy pojawiają się nowe wiadomości
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages])

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

  // Funkcja do czyszczenia historii czatu
  const clearChatHistory = () => {
    setMessages([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setAttachments([]) // Wyczyść załączniki po wysłaniu
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          attachments: userMessage.attachments?.map((att) => ({
            name: att.file.name,
            type: att.file.type,
            data: att.preview, // This now contains base64 data
          })) || [],
        }),
      })

      if (!response.ok) {
        throw new Error("Błąd podczas komunikacji z API")
      }

      // Sprawdź czy to PDF (nie-streaming response)
      const contentType = response.headers.get("content-type")
      if (contentType === "text/plain") {
        // PDF response - nie-streaming
        const content = await response.text()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: content,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // Streaming response dla zwykłych wiadomości i obrazów
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
    <div className="flex flex-col h-full max-h-[calc(100vh-2rem)]">
      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col shadow-lg border-0 bg-card/50 backdrop-blur-sm min-h-0">
        {/* Header with Clear Button */}
        {messages.length > 0 && (
          <div className="flex justify-center p-3 border-b bg-card/30">
            <Button
              variant="outline"
              size="sm"
              onClick={clearChatHistory}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Wyczyść historię
            </Button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Witaj w Chat AI!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Rozpocznij rozmowę, zadaj pytanie lub dodaj pliki PDF/obrazy do analizy
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">📄 Analiza PDF</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">🖼️ Opisy obrazów</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">💬 Rozmowa z AI</span>
                  </div>
                </div>
              )}

              {messages.map((message, index) => {
                const isUser = message.role === "user";
                const showAvatar = index === 0 || messages[index - 1]?.role !== message.role;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && showAvatar && (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    
                    {!isUser && !showAvatar && <div className="w-10" />}
                    
                    <div className={`flex flex-col max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {message.attachments.map((attachment, attIndex) => (
                            <div key={attIndex} className="relative">
                              {attachment.type === "image" && attachment.preview ? (
                                <Image
                                  src={attachment.preview}
                                  alt={attachment.file.name}
                                  width={120}
                                  height={120}
                                  className="rounded-lg object-cover border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                                  onClick={() => {
                                    // Otwórz obraz w pełnym rozmiarze
                                    window.open(attachment.preview, '_blank');
                                  }}
                                />
                              ) : (
                                <div className="w-24 h-24 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-primary/20">
                                  <div className="text-center">
                                    <Paperclip className="w-6 h-6 mx-auto mb-1 text-primary" />
                                    <span className="text-xs text-muted-foreground truncate block px-1">
                                      {attachment.file.name}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Message content */}
                      {message.content && (
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isUser 
                              ? "bg-primary text-primary-foreground rounded-br-md" 
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                      )}
                      
                      {/* Message timestamp */}
                      <div className={`text-xs text-muted-foreground mt-1 px-2 ${
                        isUser ? "text-right" : "text-left"
                      }`}>
                        {new Date().toLocaleTimeString('pl-PL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    
                    {isUser && (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="text-sm text-muted-foreground ml-2">AI pisze...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t bg-card/50 backdrop-blur-sm">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Załączone pliki ({attachments.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative bg-muted/50 hover:bg-muted rounded-lg p-3 flex items-center gap-3 border transition-colors">
                    {attachment.type === "image" && attachment.preview ? (
                      <Image
                        src={attachment.preview || "/placeholder.svg"}
                        alt={attachment.file.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{attachment.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-6 h-6 p-0 hover:bg-destructive/10 hover:text-destructive" 
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-3 items-end">
              {/* File Upload Button */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="w-12 h-12 rounded-full border-2 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
              </div>

              {/* Text Input */}
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={attachments.some(att => att.file.type === 'application/pdf') 
                    ? "Zadaj pytanie o PDF (np. 'Streść rozdział 2')" 
                    : attachments.some(att => att.file.type.startsWith('image/'))
                    ? "Opisz obrazy lub zadaj pytanie o nie"
                    : "Napisz wiadomość..."}
                  className="min-h-[48px] pr-12 border-2 rounded-2xl focus:border-primary/50 transition-colors"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                
                {/* Send Button */}
                <Button 
                  type="submit" 
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 transition-colors"
                  disabled={isLoading || (!input.trim() && attachments.length === 0)}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Helper Text */}
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {attachments.length > 0 ? (
                "Pliki zostały załączone. Możesz zadać pytanie o ich zawartość."
              ) : (
                "Naciśnij Enter aby wysłać, Shift+Enter dla nowej linii"
              )}
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
